-- Enable RLS on RENT_leases table if not already enabled
ALTER TABLE "RENT_leases" ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all operations for authenticated and anonymous users
-- This will allow the REST API to access the table
CREATE POLICY "Allow all operations on RENT_leases" ON "RENT_leases"
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Alternative: If you want more restrictive policies, you can use these instead:
-- CREATE POLICY "Allow read access on RENT_leases" ON "RENT_leases"
--     FOR SELECT
--     USING (true);

-- CREATE POLICY "Allow insert access on RENT_leases" ON "RENT_leases"
--     FOR INSERT
--     WITH CHECK (true);

-- CREATE POLICY "Allow update access on RENT_leases" ON "RENT_leases"
--     FOR UPDATE
--     USING (true)
--     WITH CHECK (true);

-- CREATE POLICY "Allow delete access on RENT_leases" ON "RENT_leases"
--     FOR DELETE
--     USING (true);

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'rent_leases'; 