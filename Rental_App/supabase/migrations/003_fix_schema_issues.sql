-- Fix schema issues and ensure all columns exist

-- Ensure status column exists in RENT_properties
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'RENT_properties' AND column_name = 'status') THEN
        ALTER TABLE RENT_properties ADD COLUMN status property_status DEFAULT 'empty';
    END IF;
END $$;

-- Ensure is_active column exists in RENT_tenants
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'RENT_tenants' AND column_name = 'is_active') THEN
        ALTER TABLE RENT_tenants ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Ensure lease_start_date and lease_end_date exist in RENT_tenants
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'RENT_tenants' AND column_name = 'lease_start_date') THEN
        ALTER TABLE RENT_tenants ADD COLUMN lease_start_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'RENT_tenants' AND column_name = 'lease_end_date') THEN
        ALTER TABLE RENT_tenants ADD COLUMN lease_end_date DATE;
    END IF;
END $$;

-- Remove move_in_date column if it exists (we're using lease_start_date instead)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'RENT_tenants' AND column_name = 'move_in_date') THEN
        ALTER TABLE RENT_tenants DROP COLUMN move_in_date;
    END IF;
END $$;

-- Update any existing tenants to have proper lease dates if they don't have them
UPDATE RENT_tenants 
SET 
    lease_start_date = COALESCE(lease_start_date, '2025-01-15'),
    lease_end_date = COALESCE(lease_end_date, '2030-01-01'),
    is_active = COALESCE(is_active, true)
WHERE lease_start_date IS NULL OR lease_end_date IS NULL OR is_active IS NULL;

-- Ensure all properties have a status
UPDATE RENT_properties 
SET status = COALESCE(status, 'empty')
WHERE status IS NULL; 