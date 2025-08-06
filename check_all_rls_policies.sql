-- Check RLS policies for all tables used by the API
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled,
    CASE WHEN p.policyname IS NOT NULL THEN 'Has Policies' ELSE 'No Policies' END as policy_status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename
WHERE t.tablename IN ('rent_tenants', 'rent_properties', 'rent_leases', 'transactions')
AND t.schemaname = 'public'
GROUP BY schemaname, tablename, rowsecurity, p.policyname
ORDER BY tablename;

-- Check specific policies for each table
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd
FROM pg_policies 
WHERE tablename IN ('rent_tenants', 'rent_properties', 'rent_leases', 'transactions')
ORDER BY tablename, policyname;

-- Test direct access to all tables
SELECT 'RENT_tenants' as table_name, COUNT(*) as record_count FROM "RENT_tenants"
UNION ALL
SELECT 'RENT_properties' as table_name, COUNT(*) as record_count FROM "RENT_properties"
UNION ALL
SELECT 'RENT_leases' as table_name, COUNT(*) as record_count FROM "RENT_leases"
UNION ALL
SELECT 'transactions' as table_name, COUNT(*) as record_count FROM "transactions"; 