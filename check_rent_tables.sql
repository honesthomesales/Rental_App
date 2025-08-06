-- Check all RENT_ prefixed tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'rent_%'
ORDER BY table_name;

-- Check structure of each RENT_ table
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name LIKE 'rent_%'
ORDER BY table_name, ordinal_position;

-- Check record counts for each RENT_ table
SELECT 'RENT_tenants' as table_name, COUNT(*) as record_count FROM "RENT_tenants"
UNION ALL
SELECT 'RENT_properties' as table_name, COUNT(*) as record_count FROM "RENT_properties"
UNION ALL
SELECT 'RENT_leases' as table_name, COUNT(*) as record_count FROM "RENT_leases"
UNION ALL
SELECT 'RENT_payments' as table_name, COUNT(*) as record_count FROM "RENT_payments"; 