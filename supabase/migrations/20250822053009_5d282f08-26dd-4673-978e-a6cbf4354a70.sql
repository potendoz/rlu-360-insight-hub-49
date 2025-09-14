-- Temporarily disable RLS on mismatch_data and mismatch_analysis for data input
-- This allows users to add data without authentication

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users with proper roles can manage mismatch data" ON public.mismatch_data;
DROP POLICY IF EXISTS "Admin and lab_manager can manage mismatch analysis" ON public.mismatch_analysis;

-- Create simple policies that allow all operations
CREATE POLICY "Allow all operations on mismatch_data" 
ON public.mismatch_data 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations on mismatch_analysis" 
ON public.mismatch_analysis 
FOR ALL 
USING (true)
WITH CHECK (true);