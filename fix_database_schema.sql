-- Fix database schema issues for rental app
-- Run this script in your Supabase SQL Editor

-- 1. Ensure status column exists in rent_properties
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rent_properties' AND column_name = 'status') THEN
        ALTER TABLE rent_properties ADD COLUMN status property_status DEFAULT 'empty';
    END IF;
END $$;

-- 2. Ensure is_active column exists in rent_tenants
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rent_tenants' AND column_name = 'is_active') THEN
        ALTER TABLE rent_tenants ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- 3. Ensure lease_start_date and lease_end_date exist in rent_tenants
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rent_tenants' AND column_name = 'lease_start_date') THEN
        ALTER TABLE rent_tenants ADD COLUMN lease_start_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rent_tenants' AND column_name = 'lease_end_date') THEN
        ALTER TABLE rent_tenants ADD COLUMN lease_end_date DATE;
    END IF;
END $$;

-- 4. Remove move_in_date column if it exists (we're using lease_start_date instead)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'rent_tenants' AND column_name = 'move_in_date') THEN
        ALTER TABLE rent_tenants DROP COLUMN move_in_date;
    END IF;
END $$;

-- 5. Update any existing tenants to have proper lease dates if they don't have them
UPDATE rent_tenants 
SET 
    lease_start_date = COALESCE(lease_start_date, '2025-01-15'),
    lease_end_date = COALESCE(lease_end_date, '2030-01-01'),
    is_active = COALESCE(is_active, true)
WHERE lease_start_date IS NULL OR lease_end_date IS NULL OR is_active IS NULL;

-- 6. Ensure all properties have a status
UPDATE rent_properties 
SET status = COALESCE(status, 'empty')
WHERE status IS NULL;

-- 7. Ensure rent_payments table exists
CREATE TABLE IF NOT EXISTS rent_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES rent_properties(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES rent_tenants(id) ON DELETE SET NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_type VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create indexes for rent_payments if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_property_id') THEN
        CREATE INDEX idx_payments_property_id ON rent_payments(property_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_tenant_id') THEN
        CREATE INDEX idx_payments_tenant_id ON rent_payments(tenant_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_date') THEN
        CREATE INDEX idx_payments_date ON rent_payments(payment_date);
    END IF;
END $$;

-- 9. Create trigger for rent_payments updated_at if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payments_updated_at') THEN
        CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON rent_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 10. Verify the fixes
SELECT 'Schema fixes applied successfully' as status; 