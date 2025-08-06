-- Query to check the structure of RENT_leases table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'RENT_leases' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also check if the table exists and get a sample of data
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'RENT_leases'
) as table_exists;

-- If table exists, get a sample of data
SELECT * FROM RENT_leases LIMIT 5; 