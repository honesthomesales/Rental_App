-- Find all tables that might contain transaction or payment data
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
    table_name ILIKE '%transaction%' 
    OR table_name ILIKE '%payment%' 
    OR table_name ILIKE '%rent_%'
)
ORDER BY table_name;

-- Check if there's a RENT_payments table
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'rent_payments'
) as rent_payments_exists;

-- If RENT_payments exists, check its structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'rent_payments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check all tables in the database
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name; 