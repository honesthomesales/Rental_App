-- Quick test to see what tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%rent%'
ORDER BY table_name; 