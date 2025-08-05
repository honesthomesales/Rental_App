-- Update all existing tenants with new lease information
UPDATE RENT_tenants 
SET 
    lease_start_date = '2025-01-15',
    lease_end_date = '2030-01-01',
    updated_at = NOW()
WHERE lease_start_date IS NULL OR lease_end_date IS NULL;

-- Insert lease records for all existing tenants
INSERT INTO RENT_leases (tenant_id, property_id, lease_start_date, lease_end_date, rent, rent_cadence, move_in_fee, late_fee_amount, lease_pdf, status, notes, created_at, updated_at)
SELECT 
    t.id as tenant_id,
    t.property_id,
    t.lease_start_date,
    t.lease_end_date,
    t.monthly_rent as rent,
    'monthly' as rent_cadence,
    t.monthly_rent as move_in_fee,
    50.00 as late_fee_amount,
    NULL as lease_pdf,
    'active' as status,
    'Auto-generated lease from tenant data' as notes,
    NOW() as created_at,
    NOW() as updated_at
FROM RENT_tenants t
JOIN RENT_properties p ON t.property_id = p.id
WHERE t.is_active = true;

-- Verify the update
SELECT 
    first_name, 
    last_name, 
    lease_start_date, 
    lease_end_date,
    property_id
FROM RENT_tenants 
WHERE is_active = true
ORDER BY first_name, last_name; 