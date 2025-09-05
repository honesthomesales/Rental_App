-- Add rent_due_day column to RENT_leases table
-- This column is required for monthly rent cadence to specify which day of the month rent is due

ALTER TABLE RENT_leases 
ADD COLUMN IF NOT EXISTS rent_due_day INTEGER;

-- Add comment to explain the column
COMMENT ON COLUMN RENT_leases.rent_due_day IS 'Day of the month when rent is due (1-31). Only used for monthly cadence.';

-- Add check constraint to ensure valid day range
ALTER TABLE RENT_leases 
ADD CONSTRAINT check_rent_due_day_range 
CHECK (rent_due_day IS NULL OR (rent_due_day >= 1 AND rent_due_day <= 31));

-- Update existing monthly leases to have a default due day of 1
UPDATE RENT_leases 
SET rent_due_day = 1 
WHERE rent_cadence = 'monthly' AND rent_due_day IS NULL;
