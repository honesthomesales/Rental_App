-- Check if RLS is enabled on RENT_leases table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'rent_leases';

-- Check RLS policies on RENT_leases table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'rent_leases';

-- Check if the table is accessible via REST API
-- This will show if there are any policies that might be blocking access
SELECT 
    t.table_name,
    t.table_type,
    CASE WHEN p.policyname IS NOT NULL THEN 'Has RLS Policy' ELSE 'No RLS Policy' END as rls_status
FROM information_schema.tables t
LEFT JOIN pg_policies p ON t.table_name = p.tablename
WHERE t.table_name = 'rent_leases' 
AND t.table_schema = 'public';

-- Test direct access to the table
SELECT COUNT(*) as record_count FROM RENT_leases; 