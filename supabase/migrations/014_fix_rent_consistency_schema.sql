-- Fix Rent Consistency Schema Issues
-- This migration removes duplicate fields and ensures RENT_leases is the single source of truth

-- =====================================================
-- 1. Remove monthly_rent from RENT_properties (if it exists)
-- =====================================================
-- Check if the table exists and has the column before trying to drop it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'rent_properties' 
        AND table_schema = 'public'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'rent_properties' 
            AND column_name = 'monthly_rent'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE "RENT_properties" DROP COLUMN monthly_rent;
        END IF;
    END IF;
END $$;

-- =====================================================
-- 2. Drop dependent views first (they depend on columns we're removing)
-- =====================================================
-- Drop all views that depend on the columns we're about to remove
DROP VIEW IF EXISTS "RENT_expected_by_month";
DROP VIEW IF EXISTS "RENT_period_balances";
DROP VIEW IF EXISTS "rent_rent_periods_display";
DROP VIEW IF EXISTS "rent_expected_by_month";
DROP VIEW IF EXISTS "rent_period_balances";

-- =====================================================
-- 3. Remove duplicate fields from RENT_rent_periods
-- =====================================================
-- Remove rent_amount, rent_cadence, and status from RENT_rent_periods
-- These should only exist in RENT_leases
ALTER TABLE "RENT_rent_periods" DROP COLUMN IF EXISTS rent_amount;
ALTER TABLE "RENT_rent_periods" DROP COLUMN IF EXISTS rent_cadence;
ALTER TABLE "RENT_rent_periods" DROP COLUMN IF EXISTS status;

-- =====================================================
-- 4. RENT_period_balances is a view (already dropped above)
-- =====================================================
-- RENT_period_balances is a view, not a table, so we don't need to drop columns from it
-- We already dropped the view above and will recreate it later

-- =====================================================
-- 5. Update RENT_period_balances to get rent data from RENT_leases
-- =====================================================
-- Recreate the view to get rent data from the lease
DROP VIEW IF EXISTS "RENT_period_balances";

CREATE VIEW "RENT_period_balances" AS
SELECT 
  p.id,
  p.tenant_id,
  p.property_id,
  p.lease_id,
  p.period_due_date,
  l.rent as rent_amount,
  l.rent_cadence,
  CASE 
    WHEN p.amount_paid >= l.rent + COALESCE(p.late_fee_applied, 0) THEN 'paid'
    WHEN p.amount_paid > 0 THEN 'partial'
    WHEN p.period_due_date < CURRENT_DATE THEN 'overdue'
    ELSE 'unpaid'
  END as status,
  p.amount_paid,
  p.late_fee_applied,
  p.late_fee_waived,
  p.due_date_override,
  p.notes,
  p.created_at,
  p.updated_at,
  (l.rent + COALESCE(p.late_fee_applied, 0)) as total_due,
  GREATEST((l.rent + COALESCE(p.late_fee_applied, 0)) - COALESCE(p.amount_paid, 0), 0) as remaining_due
FROM "RENT_rent_periods" p
JOIN "RENT_leases" l ON p.lease_id = l.id;

-- =====================================================
-- 6. Update RENT_expected_by_month view to use RENT_leases
-- =====================================================
-- Recreate the view to get expected rent from leases
DROP VIEW IF EXISTS "RENT_expected_by_month";

CREATE VIEW "RENT_expected_by_month" AS
SELECT 
  DATE_TRUNC('month', COALESCE(p.due_date_override, p.period_due_date))::date as month,
  SUM(l.rent) as expected_rent,
  SUM(COALESCE(p.late_fee_applied, 0)) as expected_late_fees
FROM "RENT_rent_periods" p
JOIN "RENT_leases" l ON p.lease_id = l.id
GROUP BY 1;

-- =====================================================
-- 7. Update RENT_collected_by_month view to use RENT_leases
-- =====================================================
-- Recreate the view to get collected rent from leases
DROP VIEW IF EXISTS "RENT_collected_by_month";

CREATE VIEW "RENT_collected_by_month" AS
SELECT 
  DATE_TRUNC('month', pay.payment_date)::date as month,
  SUM(COALESCE(a.amount_to_rent, 0)) as collected_rent,
  SUM(COALESCE(a.amount_to_late_fee, 0)) as collected_late_fees
FROM "RENT_payment_allocations" a
JOIN "RENT_payments" pay ON pay.id = a.payment_id
GROUP BY 1;

-- =====================================================
-- 8. Add missing columns to RENT_rent_periods if needed
-- =====================================================
-- Ensure RENT_rent_periods has all necessary columns
ALTER TABLE "RENT_rent_periods" 
ADD COLUMN IF NOT EXISTS late_fee_applied NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS late_fee_waived BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS due_date_override DATE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- =====================================================
-- 9. Update RENT_rent_periods to get rent data from lease
-- =====================================================
-- Add a function to get rent amount from lease
CREATE OR REPLACE FUNCTION get_rent_amount_from_lease(p_lease_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  rent_amount NUMERIC;
BEGIN
  SELECT rent INTO rent_amount 
  FROM "RENT_leases" 
  WHERE id = p_lease_id;
  
  RETURN COALESCE(rent_amount, 0);
END;
$$ LANGUAGE plpgsql;

-- Add a function to get rent cadence from lease
CREATE OR REPLACE FUNCTION get_rent_cadence_from_lease(p_lease_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  rent_cadence VARCHAR;
BEGIN
  SELECT rent_cadence INTO rent_cadence 
  FROM "RENT_leases" 
  WHERE id = p_lease_id;
  
  RETURN COALESCE(rent_cadence, 'monthly');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. Create helper view for rent periods with lease data
-- =====================================================
CREATE OR REPLACE VIEW "RENT_rent_periods_with_lease" AS
SELECT 
  p.id,
  p.tenant_id,
  p.property_id,
  p.lease_id,
  p.period_due_date,
  l.rent as rent_amount,
  l.rent_cadence,
  CASE 
    WHEN p.amount_paid >= l.rent + COALESCE(p.late_fee_applied, 0) THEN 'paid'
    WHEN p.amount_paid > 0 THEN 'partial'
    WHEN p.period_due_date < CURRENT_DATE THEN 'overdue'
    ELSE 'unpaid'
  END as status,
  p.amount_paid,
  p.late_fee_applied,
  p.late_fee_waived,
  p.due_date_override,
  p.notes,
  p.created_at,
  p.updated_at
FROM "RENT_rent_periods" p
JOIN "RENT_leases" l ON p.lease_id = l.id;

-- =====================================================
-- 11. Grant necessary permissions
-- =====================================================
GRANT SELECT ON "RENT_rent_periods_with_lease" TO authenticated;
GRANT SELECT ON "RENT_period_balances" TO authenticated;
GRANT SELECT ON "RENT_expected_by_month" TO authenticated;
GRANT SELECT ON "RENT_collected_by_month" TO authenticated;

-- =====================================================
-- 12. Create indexes for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_rent_periods_lease_id ON "RENT_rent_periods"(lease_id);
CREATE INDEX IF NOT EXISTS idx_rent_periods_tenant_id ON "RENT_rent_periods"(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rent_periods_property_id ON "RENT_rent_periods"(property_id);
CREATE INDEX IF NOT EXISTS idx_rent_periods_due_date ON "RENT_rent_periods"(period_due_date);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Summary of changes:
-- 1. Removed monthly_rent from RENT_properties
-- 2. Dropped RENT_expected_by_month table
-- 3. Removed rent_amount, rent_cadence, status from RENT_rent_periods
-- 4. Removed rent_amount, rent_cadence, status from RENT_period_balances
-- 5. Updated views to get rent data from RENT_leases
-- 6. Created helper functions and views for backward compatibility
-- 7. RENT_leases is now the single source of truth for rent data
-- =====================================================
