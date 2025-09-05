-- Add RPC functions for rent source data access
-- These functions provide access to the views that are not in the generated types

-- Function to get expected rent by month
CREATE OR REPLACE FUNCTION get_expected_rent_by_month()
RETURNS TABLE(
  month date,
  expected_rent numeric,
  expected_late_fees numeric
) 
LANGUAGE sql
AS $$
  SELECT 
    month,
    expected_rent,
    expected_late_fees
  FROM RENT_expected_by_month
  ORDER BY month;
$$;

-- Function to get collected rent by month
CREATE OR REPLACE FUNCTION get_collected_rent_by_month()
RETURNS TABLE(
  month date,
  collected_rent numeric,
  collected_late_fees numeric
) 
LANGUAGE sql
AS $$
  SELECT 
    month,
    collected_rent,
    collected_late_fees
  FROM RENT_collected_by_month
  ORDER BY month;
$$;

-- Function to get period balances for a specific lease
CREATE OR REPLACE FUNCTION get_period_balances(p_lease_id uuid)
RETURNS TABLE(
  id uuid,
  lease_id uuid,
  tenant_id uuid,
  property_id uuid,
  period_due_date date,
  rent_amount numeric,
  rent_cadence varchar,
  status varchar,
  amount_paid numeric,
  late_fee_applied numeric,
  late_fee_waived boolean,
  due_date_override date,
  notes text,
  days_late integer,
  created_at timestamptz,
  updated_at timestamptz,
  total_due numeric,
  remaining_due numeric
) 
LANGUAGE sql
AS $$
  SELECT 
    p.id,
    p.lease_id,
    p.tenant_id,
    p.property_id,
    p.period_due_date,
    p.rent_amount,
    p.rent_cadence,
    p.status,
    p.amount_paid,
    p.late_fee_applied,
    p.late_fee_waived,
    p.due_date_override,
    p.notes,
    p.days_late,
    p.created_at,
    p.updated_at,
    (p.rent_amount + coalesce(p.late_fee_applied,0)) as total_due,
    greatest((p.rent_amount + coalesce(p.late_fee_applied,0)) - coalesce(p.amount_paid,0), 0) as remaining_due
  FROM RENT_period_balances p
  WHERE p.lease_id = p_lease_id
  ORDER BY p.period_due_date;
$$;
