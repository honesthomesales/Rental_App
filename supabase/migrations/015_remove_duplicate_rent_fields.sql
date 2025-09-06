-- Remove duplicate rent fields from RENT_tenants and RENT_properties tables
-- This migration ensures all rent data comes from RENT_leases table for consistency

-- Remove monthly_rent from RENT_properties table
-- This field is duplicated in RENT_leases table and should not be used
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'RENT_properties' AND column_name = 'monthly_rent') THEN
        ALTER TABLE RENT_properties DROP COLUMN monthly_rent;
        RAISE NOTICE 'Removed monthly_rent column from RENT_properties table';
    END IF;
END $$;

-- Remove monthly_rent from RENT_tenants table
-- This field is duplicated in RENT_leases table and should not be used
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'RENT_tenants' AND column_name = 'monthly_rent') THEN
        ALTER TABLE RENT_tenants DROP COLUMN monthly_rent;
        RAISE NOTICE 'Removed monthly_rent column from RENT_tenants table';
    END IF;
END $$;

-- Note: We keep lease_start_date, lease_end_date, and lease_pdf_url in RENT_tenants
-- as these can serve as fallback values when no active lease exists
-- The application should prioritize RENT_leases data but fall back to tenant data when needed

-- Add comment to document the change
COMMENT ON TABLE RENT_leases IS 'Master source for all rent-related data. All rent amounts, cadences, and lease dates should come from this table.';
COMMENT ON TABLE RENT_tenants IS 'Tenant information. Lease dates and PDF URL serve as fallback when no active lease exists.';
COMMENT ON TABLE RENT_properties IS 'Property information. Does not contain rent data - all rent information comes from RENT_leases table.';
