-- Update RLS policies to allow public access for initial setup
DROP POLICY IF EXISTS "Admin users can manage all users" ON public.users;
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;

-- Create more permissive policies for now (we'll restrict later when auth is fully integrated)
CREATE POLICY "Public can view users" 
ON public.users 
FOR SELECT 
USING (true);

CREATE POLICY "Public can manage users" 
ON public.users 
FOR ALL 
USING (true) 
WITH CHECK (true);