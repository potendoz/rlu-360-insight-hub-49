-- Remove the test users that were created in the previous migration
DELETE FROM public.profiles WHERE email IN ('lab_manager@test.com', 'admin@test.com');

-- Update the mismatch_data RLS policy to work with proper authentication
DROP POLICY IF EXISTS "Admin and lab_manager can manage mismatch data" ON public.mismatch_data;

CREATE POLICY "Authenticated users with proper roles can manage mismatch data" 
ON public.mismatch_data 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'lab_manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'lab_manager')
  )
);