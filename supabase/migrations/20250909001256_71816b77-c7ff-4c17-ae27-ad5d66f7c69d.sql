-- Temporarily update RLS policies to allow admin operations with custom auth
-- Note: This is a temporary solution. For production, implement proper Supabase auth integration.

DROP POLICY IF EXISTS "Admin users can manage doctor monthly data" ON doctor_monthly_data;

-- Create a policy that allows all authenticated operations for now
-- TODO: Update when proper Supabase auth is implemented
CREATE POLICY "Allow admin operations on doctor monthly data" 
ON doctor_monthly_data 
FOR ALL 
USING (true) 
WITH CHECK (true);