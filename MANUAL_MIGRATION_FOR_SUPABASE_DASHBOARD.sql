-- =====================================================
-- MANUAL MIGRATION FOR SUPABASE DASHBOARD
-- Copy and paste this entire script into Supabase SQL Editor
-- =====================================================

-- Step 1: Remove monthly_rent from RENT_properties
ALTER TABLE "RENT_properties" DROP COLUMN IF EXISTS monthly_rent;

-- Step 2: Remove monthly_rent from RENT_tenants  
ALTER TABLE "RENT_tenants" DROP COLUMN IF EXISTS monthly_rent;

-- Step 3: Drop dependent views first
DROP VIEW IF EXISTS "RENT_expected_by_month";
DROP VIEW IF EXISTS "RENT_period_balances";
DROP VIEW IF EXISTS "rent_rent_periods_display";
DROP VIEW IF EXISTS "rent_expected_by_month";
DROP VIEW IF EXISTS "rent_period_balances";

-- Step 4: Remove duplicate fields from RENT_rent_periods
ALTER TABLE "RENT_rent_periods" DROP COLUMN IF EXISTS rent_amount;
ALTER TABLE "RENT_rent_periods" DROP COLUMN IF EXISTS rent_cadence;
ALTER TABLE "RENT_rent_periods" DROP COLUMN IF EXISTS status;

-- Step 5: Add rent_due_day to RENT_leases if it doesn't exist
ALTER TABLE "RENT_leases" ADD COLUMN IF NOT EXISTS rent_due_day INTEGER;

-- Step 6: Rename lease_pdf to lease_pdf_url if needed
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'RENT_leases' AND column_name = 'lease_pdf') THEN
        ALTER TABLE "RENT_leases" RENAME COLUMN lease_pdf TO lease_pdf_url;
    END IF;
END $$;

-- Step 7: Recreate RENT_expected_by_month view
CREATE OR REPLACE VIEW "RENT_expected_by_month" AS
SELECT 
    date_trunc('month', p.period_due_date)::date as month,
    sum(l.rent) as expected_rent,
    sum(coalesce(p.late_fee_applied, 0)) as expected_late_fees
FROM "RENT_rent_periods" p
JOIN "RENT_leases" l ON p.lease_id = l.id
GROUP BY 1;

-- Step 8: Recreate RENT_period_balances view
CREATE OR REPLACE VIEW "RENT_period_balances" AS
SELECT 
    p.*,
    l.rent as rent_amount,
    l.rent_cadence,
    l.status as lease_status,
    (l.rent + coalesce(p.late_fee_applied, 0)) as total_due,
    greatest((l.rent + coalesce(p.late_fee_applied, 0)) - coalesce(p.amount_paid, 0), 0) as remaining_due
FROM "RENT_rent_periods" p
JOIN "RENT_leases" l ON p.lease_id = l.id;

-- Step 9: Update rent_generate_periods function
CREATE OR REPLACE FUNCTION rent_generate_periods(p_lease_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    lease_record RECORD;
    current_period_date DATE;
    period_due_date DATE;
    period_count INTEGER := 0;
    max_periods INTEGER := 100;
BEGIN
    SELECT 
        id, tenant_id, property_id, rent, rent_cadence, rent_due_day,
        lease_start_date, lease_end_date, late_fee_amount
    INTO lease_record
    FROM RENT_leases 
    WHERE id = p_lease_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lease with id % not found', p_lease_id;
    END IF;
    
    DELETE FROM RENT_rent_periods WHERE lease_id = p_lease_id;
    current_period_date := lease_record.lease_start_date;
    
    WHILE current_period_date <= lease_record.lease_end_date AND period_count < max_periods LOOP
        period_count := period_count + 1;
        
        IF lease_record.rent_cadence = 'monthly' THEN
            period_due_date := DATE_TRUNC('month', current_period_date) + INTERVAL '1 month' - INTERVAL '1 day';
            period_due_date := LEAST(period_due_date, lease_record.lease_end_date);
            
            IF lease_record.rent_due_day IS NOT NULL THEN
                period_due_date := DATE_TRUNC('month', period_due_date) + INTERVAL '1 day' * (lease_record.rent_due_day - 1);
                IF EXTRACT(DAY FROM period_due_date) != lease_record.rent_due_day THEN
                    period_due_date := DATE_TRUNC('month', period_due_date) + INTERVAL '1 month' - INTERVAL '1 day';
                END IF;
            END IF;
            
            current_period_date := period_due_date + INTERVAL '1 day';
            
        ELSIF lease_record.rent_cadence = 'weekly' THEN
            period_due_date := current_period_date;
            WHILE EXTRACT(DOW FROM period_due_date) != 5 LOOP
                period_due_date := period_due_date + INTERVAL '1 day';
            END LOOP;
            period_due_date := LEAST(period_due_date, lease_record.lease_end_date);
            current_period_date := period_due_date + INTERVAL '1 day';
            
        ELSIF lease_record.rent_cadence = 'biweekly' THEN
            period_due_date := current_period_date;
            WHILE EXTRACT(DOW FROM period_due_date) != 5 LOOP
                period_due_date := period_due_date + INTERVAL '1 day';
            END LOOP;
            period_due_date := LEAST(period_due_date, lease_record.lease_end_date);
            current_period_date := period_due_date + INTERVAL '2 weeks' + INTERVAL '1 day';
        END IF;
        
        IF period_due_date > lease_record.lease_end_date THEN
            EXIT;
        END IF;
        
        INSERT INTO RENT_rent_periods (
            id, lease_id, tenant_id, property_id, period_due_date,
            late_fee_applied, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), lease_record.id, lease_record.tenant_id,
            lease_record.property_id, period_due_date,
            COALESCE(lease_record.late_fee_amount, 0), NOW(), NOW()
        );
    END LOOP;
    
    RAISE NOTICE 'Generated % periods for lease %', period_count, p_lease_id;
END;
$$;

-- Step 10: Create helper function
CREATE OR REPLACE FUNCTION get_property_rent_info(p_property_id UUID)
RETURNS TABLE(
    rent_amount DECIMAL(10,2),
    rent_cadence VARCHAR(20),
    late_fee_amount DECIMAL(10,2),
    status VARCHAR(20)
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.rent,
        l.rent_cadence,
        l.late_fee_amount,
        l.status
    FROM "RENT_leases" l
    WHERE l.property_id = p_property_id
    AND l.status = 'active'
    ORDER BY l.created_at DESC
    LIMIT 1;
END;
$$;

-- Step 11: Grant permissions
GRANT EXECUTE ON FUNCTION rent_generate_periods(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_property_rent_info(UUID) TO authenticated;
GRANT SELECT ON "RENT_expected_by_month" TO authenticated;
GRANT SELECT ON "RENT_period_balances" TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE!
-- =====================================================
-- Summary:
-- ✅ Removed monthly_rent from RENT_properties
-- ✅ Removed monthly_rent from RENT_tenants  
-- ✅ Removed rent_amount, rent_cadence, status from RENT_rent_periods
-- ✅ RENT_leases is now the single source of truth
-- ✅ All views and functions updated
-- =====================================================
