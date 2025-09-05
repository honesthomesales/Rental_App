-- =====================================================
-- COMPLETE RENT CONSISTENCY CLEANUP MIGRATION
-- =====================================================
-- This migration completely eliminates all duplicate rent fields
-- and ensures RENT_leases is the single source of truth
-- =====================================================

-- =====================================================
-- 1. Remove monthly_rent from RENT_properties
-- =====================================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'RENT_properties' AND column_name = 'monthly_rent') THEN
        ALTER TABLE "RENT_properties" DROP COLUMN monthly_rent;
        RAISE NOTICE 'Removed monthly_rent from RENT_properties';
    END IF;
END $$;

-- =====================================================
-- 2. Remove monthly_rent from RENT_tenants
-- =====================================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'RENT_tenants' AND column_name = 'monthly_rent') THEN
        ALTER TABLE "RENT_tenants" DROP COLUMN monthly_rent;
        RAISE NOTICE 'Removed monthly_rent from RENT_tenants';
    END IF;
END $$;

-- =====================================================
-- 3. Drop all dependent views first
-- =====================================================
DROP VIEW IF EXISTS "RENT_expected_by_month";
DROP VIEW IF EXISTS "RENT_period_balances";
DROP VIEW IF EXISTS "rent_rent_periods_display";
DROP VIEW IF EXISTS "rent_expected_by_month";
DROP VIEW IF EXISTS "rent_period_balances";

-- =====================================================
-- 4. Remove duplicate fields from RENT_rent_periods
-- =====================================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'RENT_rent_periods' AND column_name = 'rent_amount') THEN
        ALTER TABLE "RENT_rent_periods" DROP COLUMN rent_amount;
        RAISE NOTICE 'Removed rent_amount from RENT_rent_periods';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'RENT_rent_periods' AND column_name = 'rent_cadence') THEN
        ALTER TABLE "RENT_rent_periods" DROP COLUMN rent_cadence;
        RAISE NOTICE 'Removed rent_cadence from RENT_rent_periods';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'RENT_rent_periods' AND column_name = 'status') THEN
        ALTER TABLE "RENT_rent_periods" DROP COLUMN status;
        RAISE NOTICE 'Removed status from RENT_rent_periods';
    END IF;
END $$;

-- =====================================================
-- 5. Ensure RENT_leases has all required fields
-- =====================================================
-- Add rent_due_day if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'RENT_leases' AND column_name = 'rent_due_day') THEN
        ALTER TABLE "RENT_leases" ADD COLUMN rent_due_day INTEGER;
        RAISE NOTICE 'Added rent_due_day to RENT_leases';
    END IF;
END $$;

-- Add lease_pdf_url if it doesn't exist (rename from lease_pdf)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'RENT_leases' AND column_name = 'lease_pdf') THEN
        ALTER TABLE "RENT_leases" RENAME COLUMN lease_pdf TO lease_pdf_url;
        RAISE NOTICE 'Renamed lease_pdf to lease_pdf_url in RENT_leases';
    END IF;
END $$;

-- =====================================================
-- 6. Recreate views that source data from RENT_leases
-- =====================================================

-- Recreate RENT_expected_by_month view
CREATE OR REPLACE VIEW "RENT_expected_by_month" AS
SELECT 
    date_trunc('month', p.period_due_date)::date as month,
    sum(l.rent) as expected_rent,
    sum(coalesce(p.late_fee_applied, 0)) as expected_late_fees
FROM "RENT_rent_periods" p
JOIN "RENT_leases" l ON p.lease_id = l.id
GROUP BY 1;

-- Recreate RENT_period_balances view
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

-- =====================================================
-- 7. Update rent_generate_periods function to work with new schema
-- =====================================================
CREATE OR REPLACE FUNCTION rent_generate_periods(p_lease_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    lease_record RECORD;
    current_period_date DATE;
    period_due_date DATE;
    period_count INTEGER := 0;
    max_periods INTEGER := 100; -- Safety limit
BEGIN
    -- Get lease details
    SELECT 
        id, tenant_id, property_id, rent, rent_cadence, rent_due_day,
        lease_start_date, lease_end_date, late_fee_amount
    INTO lease_record
    FROM RENT_leases 
    WHERE id = p_lease_id;
    
    -- Check if lease exists
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lease with id % not found', p_lease_id;
    END IF;
    
    -- Delete existing periods for this lease (regenerate)
    DELETE FROM RENT_rent_periods WHERE lease_id = p_lease_id;
    
    -- Set current period date to lease start date
    current_period_date := lease_record.lease_start_date;
    
    -- Generate periods based on cadence
    WHILE current_period_date <= lease_record.lease_end_date AND period_count < max_periods LOOP
        period_count := period_count + 1;
        
        -- Calculate due date based on cadence
        IF lease_record.rent_cadence = 'monthly' THEN
            -- Monthly: due on specified day of month
            period_due_date := DATE_TRUNC('month', current_period_date) + INTERVAL '1 month' - INTERVAL '1 day';
            period_due_date := LEAST(period_due_date, lease_record.lease_end_date);
            
            -- Adjust to the correct day of month
            IF lease_record.rent_due_day IS NOT NULL THEN
                period_due_date := DATE_TRUNC('month', period_due_date) + INTERVAL '1 day' * (lease_record.rent_due_day - 1);
                -- If the day doesn't exist in the month, use the last day
                IF EXTRACT(DAY FROM period_due_date) != lease_record.rent_due_day THEN
                    period_due_date := DATE_TRUNC('month', period_due_date) + INTERVAL '1 month' - INTERVAL '1 day';
                END IF;
            END IF;
            
            -- Set next period start date
            current_period_date := period_due_date + INTERVAL '1 day';
            
        ELSIF lease_record.rent_cadence = 'weekly' THEN
            -- Weekly: due on Friday
            period_due_date := current_period_date;
            -- Find next Friday
            WHILE EXTRACT(DOW FROM period_due_date) != 5 LOOP
                period_due_date := period_due_date + INTERVAL '1 day';
            END LOOP;
            period_due_date := LEAST(period_due_date, lease_record.lease_end_date);
            
            -- Set next period start date (next day after Friday)
            current_period_date := period_due_date + INTERVAL '1 day';
            
        ELSIF lease_record.rent_cadence = 'biweekly' THEN
            -- Bi-weekly: due on Friday every 2 weeks
            period_due_date := current_period_date;
            -- Find next Friday
            WHILE EXTRACT(DOW FROM period_due_date) != 5 LOOP
                period_due_date := period_due_date + INTERVAL '1 day';
            END LOOP;
            period_due_date := LEAST(period_due_date, lease_record.lease_end_date);
            
            -- Set next period start date (2 weeks after current Friday)
            current_period_date := period_due_date + INTERVAL '2 weeks' + INTERVAL '1 day';
        END IF;
        
        -- Skip if due date is beyond lease end
        IF period_due_date > lease_record.lease_end_date THEN
            EXIT;
        END IF;
        
        -- Insert the period (rent_amount, rent_cadence, status removed - these come from RENT_leases)
        INSERT INTO RENT_rent_periods (
            id,
            lease_id,
            tenant_id,
            property_id,
            period_due_date,
            late_fee_applied,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            lease_record.id,
            lease_record.tenant_id,
            lease_record.property_id,
            period_due_date,
            COALESCE(lease_record.late_fee_amount, 0),
            NOW(),
            NOW()
        );
        
    END LOOP;
    
    -- Log success
    RAISE NOTICE 'Generated % periods for lease %', period_count, p_lease_id;
    
END;
$$;

-- =====================================================
-- 8. Grant permissions
-- =====================================================
GRANT EXECUTE ON FUNCTION rent_generate_periods(UUID) TO authenticated;
GRANT SELECT ON "RENT_expected_by_month" TO authenticated;
GRANT SELECT ON "RENT_period_balances" TO authenticated;

-- =====================================================
-- 9. Create helper function to get rent data from leases
-- =====================================================
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

GRANT EXECUTE ON FUNCTION get_property_rent_info(UUID) TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Summary of changes:
-- 1. Removed monthly_rent from RENT_properties
-- 2. Removed monthly_rent from RENT_tenants  
-- 3. Removed rent_amount, rent_cadence, status from RENT_rent_periods
-- 4. Recreated views to source data from RENT_leases
-- 5. Updated rent_generate_periods function
-- 6. Created helper function for rent data access
-- =====================================================
