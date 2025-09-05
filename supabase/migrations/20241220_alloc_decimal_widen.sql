-- =====================================================
-- ALLOCATION DECIMAL WIDENING MIGRATION
-- =====================================================
-- This migration widens the decimal precision for allocation amounts
-- to avoid hidden rounding issues
-- =====================================================

-- Widen decimal precision for allocation amounts
alter table "RENT_payment_allocations" 
  alter column amount_to_late_fee type numeric(10,2) using amount_to_late_fee::numeric(10,2),
  alter column amount_to_rent type numeric(10,2) using amount_to_rent::numeric(10,2);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Summary of changes:
-- - amount_to_late_fee: numeric(0,0) → numeric(10,2)
-- - amount_to_rent: numeric(0,0) → numeric(10,2)
-- =====================================================
