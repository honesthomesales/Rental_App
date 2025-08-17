-- Update all existing tenants with new lease information
-- Lease start date: 6 months ago (January 2025)
-- Lease end date: January 1, 2030
UPDATE tenants 
SET 
    lease_start_date = '2025-01-15',  -- 6 months ago
    lease_end_date = '2030-01-01',
    updated_at = NOW()
WHERE is_active = true;

-- Verify the update
SELECT 
    first_name, 
    last_name, 
    lease_start_date, 
    lease_end_date,
    property_id
FROM tenants 
WHERE is_active = true
ORDER BY first_name, last_name; 