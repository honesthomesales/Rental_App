-- Check the structure and data in RENT_rent_periods table
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'RENT_rent_periods' ORDER BY ordinal_position;

-- Check if there's any data in the table
SELECT COUNT(*) as total_periods FROM RENT_rent_periods;

-- Check a sample of the data
SELECT * FROM RENT_rent_periods LIMIT 5;
