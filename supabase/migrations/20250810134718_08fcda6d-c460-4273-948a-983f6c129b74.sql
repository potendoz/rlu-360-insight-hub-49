-- Fix RLS policies for role_permissions table to allow reading permissions

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all authenticated users to update role permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Allow authenticated users to delete role permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Allow authenticated users to insert role permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Allow authenticated users to read role permissions" ON public.role_permissions;

-- Create new policies that properly allow reading role permissions
CREATE POLICY "Anyone can read role permissions"
ON public.role_permissions
FOR SELECT 
USING (true);

-- Admin users can manage role permissions
CREATE POLICY "Admin users can manage role permissions"
ON public.role_permissions
FOR ALL
USING (has_role('admin'))
WITH CHECK (has_role('admin'));