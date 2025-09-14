-- Update the user role to lab_manager so they can add mismatch data
UPDATE public.profiles 
SET role = 'lab_manager' 
WHERE id = '0d166696-6864-460d-b28d-fad91f0dc094';