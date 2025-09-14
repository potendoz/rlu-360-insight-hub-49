-- Add lab_manager to the allowed roles in profiles table
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role = ANY (ARRAY['admin'::text, 'physician'::text, 'judge'::text, 'lab_manager'::text]));

-- Now update the user role to lab_manager
UPDATE public.profiles 
SET role = 'lab_manager' 
WHERE id = '0d166696-6864-460d-b28d-fad91f0dc094';