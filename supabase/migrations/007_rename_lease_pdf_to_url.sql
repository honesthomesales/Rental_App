-- Rename lease_pdf column to lease_pdf_url for consistency
-- This migration renames the column to be more descriptive

-- First, add the new column if it doesn't exist
ALTER TABLE RENT_leases 
ADD COLUMN IF NOT EXISTS lease_pdf_url TEXT;

-- Copy data from old column to new column
UPDATE RENT_leases 
SET lease_pdf_url = lease_pdf 
WHERE lease_pdf IS NOT NULL AND lease_pdf_url IS NULL;

-- Drop the old column
ALTER TABLE RENT_leases 
DROP COLUMN IF EXISTS lease_pdf;

-- Add comment to explain the column
COMMENT ON COLUMN RENT_leases.lease_pdf_url IS 'URL or path to the lease PDF document';
