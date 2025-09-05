-- =====================================================
-- RENT PERIOD SYNC TRIGGERS & VIEWS MIGRATION
-- =====================================================
-- This migration implements automatic synchronization between
-- RENT_payments, RENT_payment_allocations, and RENT_rent_periods
-- =====================================================

-- =====================================================
-- CHANGE 1: Auto-recalc period amount_paid when allocations change
-- =====================================================

-- Recalc helper for a single period
create or replace function RENT_recalc_period_amount_paid(p_period_id uuid)
returns void language sql as $$
  update "RENT_rent_periods" p
  set amount_paid = coalesce((
    select sum(coalesce(a.amount_to_late_fee,0) + coalesce(a.amount_to_rent,0))
    from "RENT_payment_allocations" a
    where a.rent_period_id = p.id
  ), 0)
  where p.id = p_period_id;
$$;

-- Trigger function that reacts to allocation changes
create or replace function RENT_on_alloc_change()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT') then
    perform RENT_recalc_period_amount_paid(NEW.rent_period_id);
  elsif (tg_op = 'UPDATE') then
    if (NEW.rent_period_id <> OLD.rent_period_id) then
      perform RENT_recalc_period_amount_paid(OLD.rent_period_id);
      perform RENT_recalc_period_amount_paid(NEW.rent_period_id);
    else
      perform RENT_recalc_period_amount_paid(NEW.rent_period_id);
    end if;
  elsif (tg_op = 'DELETE') then
    perform RENT_recalc_period_amount_paid(OLD.rent_period_id);
  end if;
  return null;
end;
$$;

-- Drop existing triggers if they exist
drop trigger if exists trg_alloc_sync_ins on "RENT_payment_allocations";
drop trigger if exists trg_alloc_sync_upd on "RENT_payment_allocations";
drop trigger if exists trg_alloc_sync_del on "RENT_payment_allocations";

-- Create triggers for allocation changes
create trigger trg_alloc_sync_ins after insert on "RENT_payment_allocations"
for each row execute function RENT_on_alloc_change();

create trigger trg_alloc_sync_upd after update on "RENT_payment_allocations"
for each row execute function RENT_on_alloc_change();

create trigger trg_alloc_sync_del after delete on "RENT_payment_allocations"
for each row execute function RENT_on_alloc_change();

-- =====================================================
-- CHANGE 2: Auto-reallocate when a payment changes
-- =====================================================

-- Rebuild allocations for one payment (helper)
create or replace function RENT_rebuild_one_payment(p_payment_id uuid)
returns void language plpgsql as $$
begin
  delete from "RENT_payment_allocations" where payment_id = p_payment_id;
  perform RENT_apply_payment(p_payment_id);
end;
$$;

-- Trigger function: when a payment changes materially, rebuild its allocations
create or replace function RENT_on_payment_update()
returns trigger language plpgsql as $$
begin
  if (NEW.amount is distinct from OLD.amount or 
      NEW.payment_date is distinct from OLD.payment_date or 
      NEW.lease_id is distinct from OLD.lease_id or 
      NEW.tenant_id is distinct from OLD.tenant_id) then
    perform RENT_rebuild_one_payment(NEW.id);
  end if;
  return NEW;
end;
$$;

-- Drop existing trigger if it exists
drop trigger if exists trg_payment_update_realloc on "RENT_payments";

-- Create trigger for payment updates
create trigger trg_payment_update_realloc after update on "RENT_payments"
for each row execute function RENT_on_payment_update();

-- =====================================================
-- CHANGE 3: Unique periods per (lease_id, period_due_date)
-- =====================================================

-- Enforce unique one period per lease per due date
create unique index if not exists idx_period_unique_lease_due 
on "RENT_rent_periods"(lease_id, period_due_date);

-- =====================================================
-- CHANGE 4: One-click reconciliation job (backfill + repair)
-- =====================================================

create or replace function RENT_resync_all(p_as_of date default current_date)
returns table(period_id uuid, remaining_due numeric, note text) language plpgsql as $$
begin
  -- (1) late fees as of date
  perform RENT_assess_late_fees(p_as_of);
  
  -- (2) recompute amount_paid from allocations
  update "RENT_rent_periods" p
  set amount_paid = coalesce(alloc.sum_alloc,0)
  from (
    select rent_period_id, sum(coalesce(amount_to_late_fee,0)+coalesce(amount_to_rent,0)) as sum_alloc
    from "RENT_payment_allocations"
    group by rent_period_id
  ) alloc
  where p.id = alloc.rent_period_id;
  
  -- (3) return remaining balances / anomalies (if any)
  return query
  select 
    p.id,
    (p.rent_amount + coalesce(p.late_fee_applied,0) - coalesce(p.amount_paid,0)) as remaining_due,
    case 
      when coalesce(p.amount_paid,0) > (p.rent_amount + coalesce(p.late_fee_applied,0)) 
      then 'overpaid' 
      else null 
    end
  from "RENT_rent_periods" p;
end;
$$;

-- =====================================================
-- CHANGE 5: Views for UI: single source for "expected vs collected"
-- =====================================================

-- Expected (from periods)
create or replace view RENT_expected_by_month as
select 
  date_trunc('month', coalesce(p.due_date_override, p.period_due_date))::date as month,
  sum(p.rent_amount) as expected_rent,
  sum(coalesce(p.late_fee_applied,0)) as expected_late_fees
from "RENT_rent_periods" p
group by 1;

-- Collected (from allocations by payment_date)
create or replace view RENT_collected_by_month as
select 
  date_trunc('month', pay.payment_date)::date as month,
  sum(coalesce(a.amount_to_rent,0)) as collected_rent,
  sum(coalesce(a.amount_to_late_fee,0)) as collected_late_fees
from "RENT_payment_allocations" a
join "RENT_payments" pay on pay.id = a.payment_id
group by 1;

-- Convenience view for balances per period (already similar to what we have)
create or replace view RENT_period_balances as
select 
  p.*,
  (p.rent_amount + coalesce(p.late_fee_applied,0)) as total_due,
  greatest((p.rent_amount + coalesce(p.late_fee_applied,0)) - coalesce(p.amount_paid,0), 0) as remaining_due
from "RENT_rent_periods" p;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Summary of changes:
-- 1. Auto-recalc period amount_paid when allocations change
-- 2. Auto-reallocate when payment changes materially
-- 3. Unique constraint on (lease_id, period_due_date)
-- 4. Reconciliation function for data repair
-- 5. Views for consistent expected vs collected reporting
-- =====================================================
