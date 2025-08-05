-- Populate leases table using properties and tenants as driver
-- Lease start date: 6 months ago (January 2025)
-- Lease end date: January 1, 2030
INSERT INTO leases (property_id, tenant_id, lease_start_date, lease_end_date, rent, rent_cadence, move_in_fee, late_fee_amount, status, notes, created_at, updated_at)
SELECT 
    t.property_id,
    t.id as tenant_id,
    '2025-01-15' as lease_start_date,  -- 6 months ago
    '2030-01-01' as lease_end_date,
    t.monthly_rent as rent,
    CASE 
        WHEN p.notes ILIKE '%weekly%' THEN 'weekly'
        WHEN p.notes ILIKE '%bi-weekly%' OR p.notes ILIKE '%biweekly%' THEN 'bi-weekly'
        ELSE 'monthly'
    END as rent_cadence,
    t.security_deposit as move_in_fee,
    CASE 
        WHEN p.notes ILIKE '%weekly%' THEN 10
        WHEN p.notes ILIKE '%bi-weekly%' OR p.notes ILIKE '%biweekly%' THEN 20
        ELSE 45
    END as late_fee_amount,

    'active' as status,
    '' as notes,
    NOW() as created_at,
    NOW() as updated_at
FROM tenants t
JOIN properties p ON t.property_id = p.id
WHERE t.is_active = true;

-- Verify the leases were created
SELECT 
    l.id,
    p.name as property_name,
    t.first_name || ' ' || t.last_name as tenant_name,
    l.lease_start_date,
    l.lease_end_date,
    l.rent,
    l.rent_cadence,
    l.late_fee_amount
FROM leases l
JOIN properties p ON l.property_id = p.id
JOIN tenants t ON l.tenant_id = t.id
ORDER BY p.name, t.first_name; 