-- Fix missing columns in RENT_properties table
-- Run this script in your Supabase SQL Editor

-- Add missing columns to RENT_properties table
DO $$ 
BEGIN
    -- Add insurance_expiry_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'RENT_properties' AND column_name = 'insurance_expiry_date') THEN
        ALTER TABLE "RENT_properties" ADD COLUMN insurance_expiry_date DATE;
    END IF;
    
    -- Add owner_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'RENT_properties' AND column_name = 'owner_name') THEN
        ALTER TABLE "RENT_properties" ADD COLUMN owner_name VARCHAR(255);
    END IF;
    
    -- Add owner_phone column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'RENT_properties' AND column_name = 'owner_phone') THEN
        ALTER TABLE "RENT_properties" ADD COLUMN owner_phone VARCHAR(20);
    END IF;
    
    -- Add owner_email column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'RENT_properties' AND column_name = 'owner_email') THEN
        ALTER TABLE "RENT_properties" ADD COLUMN owner_email VARCHAR(255);
    END IF;
    
    -- Add insurance_policy_number column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'RENT_properties' AND column_name = 'insurance_policy_number') THEN
        ALTER TABLE "RENT_properties" ADD COLUMN insurance_policy_number VARCHAR(100);
    END IF;
    
    -- Add insurance_provider column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'RENT_properties' AND column_name = 'insurance_provider') THEN
        ALTER TABLE "RENT_properties" ADD COLUMN insurance_provider VARCHAR(100);
    END IF;
    
    -- Add insurance_premium column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'RENT_properties' AND column_name = 'insurance_premium') THEN
        ALTER TABLE "RENT_properties" ADD COLUMN insurance_premium DECIMAL(10,2);
    END IF;
END $$;

-- Add missing columns to RENT_tenants table
DO $$ 
BEGIN
    -- Add monthly_rent column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'RENT_tenants' AND column_name = 'monthly_rent') THEN
        ALTER TABLE "RENT_tenants" ADD COLUMN monthly_rent DECIMAL(10,2);
    END IF;
    
    -- Add security_deposit column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'RENT_tenants' AND column_name = 'security_deposit') THEN
        ALTER TABLE "RENT_tenants" ADD COLUMN security_deposit DECIMAL(10,2);
    END IF;
    
    -- Add lease_pdf_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'RENT_tenants' AND column_name = 'lease_pdf_url') THEN
        ALTER TABLE "RENT_tenants" ADD COLUMN lease_pdf_url TEXT;
    END IF;
    
    -- Add payment_history column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'RENT_tenants' AND column_name = 'payment_history') THEN
        ALTER TABLE "RENT_tenants" ADD COLUMN payment_history JSONB DEFAULT '[]';
    END IF;
    
    -- Add late_fees_owed column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'RENT_tenants' AND column_name = 'late_fees_owed') THEN
        ALTER TABLE "RENT_tenants" ADD COLUMN late_fees_owed DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    -- Add emergency_contact_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'RENT_tenants' AND column_name = 'emergency_contact_name') THEN
        ALTER TABLE "RENT_tenants" ADD COLUMN emergency_contact_name VARCHAR(255);
    END IF;
    
    -- Add emergency_contact_phone column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'RENT_tenants' AND column_name = 'emergency_contact_phone') THEN
        ALTER TABLE "RENT_tenants" ADD COLUMN emergency_contact_phone VARCHAR(20);
    END IF;
END $$;

-- Verify the columns exist
SELECT 'RENT_properties' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'RENT_properties' 
AND column_name IN ('insurance_expiry_date', 'insurance_policy_number', 'insurance_provider', 'insurance_premium', 'owner_name', 'owner_phone', 'owner_email')
ORDER BY column_name;

SELECT 'RENT_tenants' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'RENT_tenants' 
AND column_name IN ('monthly_rent', 'security_deposit', 'lease_pdf_url', 'payment_history', 'late_fees_owed', 'emergency_contact_name', 'emergency_contact_phone')
ORDER BY column_name; 