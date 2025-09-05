-- Grant execute permissions on rent_generate_periods function
-- This ensures the function can be called via RPC

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION rent_generate_periods(UUID) TO authenticated;

-- Also grant to anon users if needed (uncomment if required)
-- GRANT EXECUTE ON FUNCTION rent_generate_periods(UUID) TO anon;
