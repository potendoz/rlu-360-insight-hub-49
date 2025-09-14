-- Update RLS policies for doctor_monthly_data to allow authenticated users to view data
DROP POLICY IF EXISTS "Admin users can view doctor monthly data" ON doctor_monthly_data;
DROP POLICY IF EXISTS "Admin users can manage doctor monthly data" ON doctor_monthly_data;

-- Create new policies that allow authenticated users to view data
CREATE POLICY "Authenticated users can view doctor monthly data" 
ON doctor_monthly_data FOR SELECT 
USING (true);

-- Admin users can still manage the data
CREATE POLICY "Admin users can manage doctor monthly data" 
ON doctor_monthly_data FOR ALL 
USING (has_role('admin'::text))
WITH CHECK (has_role('admin'::text));

-- Also update mismatch_data policies for consistency
DROP POLICY IF EXISTS "Admin users can view mismatch data" ON mismatch_data;
DROP POLICY IF EXISTS "Admin users can manage mismatch data" ON mismatch_data;

CREATE POLICY "Authenticated users can view mismatch data" 
ON mismatch_data FOR SELECT 
USING (true);

CREATE POLICY "Admin users can manage mismatch data" 
ON mismatch_data FOR ALL 
USING (has_role('admin'::text))
WITH CHECK (has_role('admin'::text));

-- Update mismatch_analysis policies too
DROP POLICY IF EXISTS "Admin users can view mismatch analysis" ON mismatch_analysis;
DROP POLICY IF EXISTS "Admin users can manage mismatch analysis" ON mismatch_analysis;

CREATE POLICY "Authenticated users can view mismatch analysis" 
ON mismatch_analysis FOR SELECT 
USING (true);

CREATE POLICY "Admin users can manage mismatch analysis" 
ON mismatch_analysis FOR ALL 
USING (has_role('admin'::text))
WITH CHECK (has_role('admin'::text));