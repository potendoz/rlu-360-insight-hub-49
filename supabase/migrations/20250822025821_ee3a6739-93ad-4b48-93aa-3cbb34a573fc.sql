-- Update RLS policy for mismatch_analysis to allow lab_manager to insert data
DROP POLICY IF EXISTS "Admin users can manage mismatch analysis" ON public.mismatch_analysis;

-- Create new policy that allows both admin and lab_manager to manage mismatch analysis
CREATE POLICY "Admin and lab_manager can manage mismatch analysis" 
ON public.mismatch_analysis 
FOR ALL 
USING (has_role('admin'::text) OR has_role('lab_manager'::text))
WITH CHECK (has_role('admin'::text) OR has_role('lab_manager'::text));