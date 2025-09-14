-- Drop existing policies that require admin authentication
DROP POLICY IF EXISTS "Admin users can manage doctors" ON public.doctors;
DROP POLICY IF EXISTS "Admin users can manage monthly data" ON public.doctor_monthly_data;

-- Create new policies that allow all authenticated users to manage data
CREATE POLICY "All users can manage doctors" 
ON public.doctors 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "All users can manage monthly data" 
ON public.doctor_monthly_data 
FOR ALL 
USING (true)
WITH CHECK (true);