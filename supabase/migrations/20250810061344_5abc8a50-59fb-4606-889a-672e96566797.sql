-- Allow public access to users table for authentication purposes
DROP POLICY IF EXISTS "Admin users can view users table" ON users;
DROP POLICY IF EXISTS "Admin users can manage users table" ON users;

-- Create new policies that allow login authentication
CREATE POLICY "Allow authentication queries" 
ON users 
FOR SELECT 
USING (true);

CREATE POLICY "Admin users can manage users table" 
ON users 
FOR ALL 
USING (has_role('admin'))
WITH CHECK (has_role('admin'));