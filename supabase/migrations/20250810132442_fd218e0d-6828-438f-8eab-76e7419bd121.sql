-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "Admin users can manage role permissions" ON role_permissions;
DROP POLICY IF EXISTS "Authenticated users can view role permissions" ON role_permissions;

-- Create new policies with proper UPDATE permissions
CREATE POLICY "Admin users can manage role permissions" 
ON role_permissions 
FOR ALL 
USING (has_role('admin'::text))
WITH CHECK (has_role('admin'::text));

CREATE POLICY "Authenticated users can view role permissions" 
ON role_permissions 
FOR SELECT 
USING (true);