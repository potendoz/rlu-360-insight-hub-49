-- Add password column to users table
ALTER TABLE public.users ADD COLUMN password TEXT;

-- Update existing users with their default passwords
UPDATE public.users SET password = 'rlu360admin' WHERE email = 'admin@rlu360.com';
UPDATE public.users SET password = 'rlu360doctor' WHERE email = 'physician@rlu360.com';
UPDATE public.users SET password = 'rlu360lab' WHERE email = 'labmanager@rlu360.com';
UPDATE public.users SET password = 'rlu360demo' WHERE email = 'judge@rlu360.com';