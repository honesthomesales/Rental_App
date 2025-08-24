-- Add missing fields needed for profit analysis

-- Add property_tax and purchase_payment to RENT_properties
ALTER TABLE RENT_properties 
ADD COLUMN IF NOT EXISTS property_tax DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS purchase_payment DECIMAL(10,2) DEFAULT 0;

-- Add status field to RENT_payments if it doesn't exist
ALTER TABLE RENT_payments 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'completed';

-- Add payment_type field to RENT_payments if it doesn't exist (some queries expect this)
ALTER TABLE RENT_payments 
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) DEFAULT 'rent';

-- Update existing records to have default values
UPDATE RENT_properties 
SET 
    property_tax = COALESCE(property_tax, 0),
    purchase_payment = COALESCE(purchase_payment, 0)
WHERE property_tax IS NULL OR purchase_payment IS NULL;

UPDATE RENT_payments 
SET 
    status = COALESCE(status, 'completed'),
    payment_type = COALESCE(payment_type, 'rent')
WHERE status IS NULL OR payment_type IS NULL;
