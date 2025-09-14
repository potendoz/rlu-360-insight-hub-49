-- Drop existing restrictive policies and create public access policies for development
DROP POLICY IF EXISTS "Authenticated users can view doctors" ON doctors;
DROP POLICY IF EXISTS "Admin and physician users can manage doctors" ON doctors;
DROP POLICY IF EXISTS "Authenticated users can view monthly data" ON doctor_monthly_data;
DROP POLICY IF EXISTS "Admin and physician users can manage monthly data" ON doctor_monthly_data;
DROP POLICY IF EXISTS "Authenticated users can view mismatch data" ON mismatch_data;
DROP POLICY IF EXISTS "Admin and physician users can manage mismatch data" ON mismatch_data;
DROP POLICY IF EXISTS "Authenticated users can view mismatch analysis" ON mismatch_analysis;
DROP POLICY IF EXISTS "Admin and physician users can manage mismatch analysis" ON mismatch_analysis;

-- Create public access policies for all operations (for development/demo purposes)
CREATE POLICY "Public access to doctors" ON doctors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to monthly data" ON doctor_monthly_data FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to mismatch data" ON mismatch_data FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to mismatch analysis" ON mismatch_analysis FOR ALL USING (true) WITH CHECK (true);

-- Also create public policies for other tables that might be needed
CREATE POLICY "Public access to report metadata" ON report_metadata FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to RLU KPI" ON rlu_kpi FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to physician summary" ON physician_summary FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to feedback log" ON feedback_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to AI insights" ON ai_insights FOR ALL USING (true) WITH CHECK (true);