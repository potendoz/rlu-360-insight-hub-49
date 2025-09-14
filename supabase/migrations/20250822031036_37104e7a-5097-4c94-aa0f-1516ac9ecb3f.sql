-- Update RLS policy for mismatch_data to allow lab_manager to insert data
DROP POLICY IF EXISTS "Admin users can manage mismatch data" ON public.mismatch_data;

-- Create new policy that allows both admin and lab_manager to manage mismatch data
CREATE POLICY "Admin and lab_manager can manage mismatch data" 
ON public.mismatch_data 
FOR ALL 
USING (has_role('admin'::text) OR has_role('lab_manager'::text))
WITH CHECK (has_role('admin'::text) OR has_role('lab_manager'::text));