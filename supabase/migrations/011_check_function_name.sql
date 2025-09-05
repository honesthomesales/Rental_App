-- Check the exact function name and signature
SELECT 
    routine_name, 
    routine_type,
    specific_name,
    data_type,
    parameter_name,
    parameter_mode,
    data_type as parameter_type
FROM information_schema.routines r
LEFT JOIN information_schema.parameters p ON r.specific_name = p.specific_name
WHERE routine_name ILIKE '%generate_periods%'
ORDER BY r.routine_name, p.ordinal_position;
