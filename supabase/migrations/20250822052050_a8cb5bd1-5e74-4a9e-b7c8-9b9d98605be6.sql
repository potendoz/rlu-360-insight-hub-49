-- Create a test user profile for lab_manager role
INSERT INTO public.profiles (id, email, name, role)
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
  'lab_manager@test.com',
  'Lab Manager',
  'lab_manager'
)
ON CONFLICT (id) DO NOTHING;

-- Create a test user profile for admin role  
INSERT INTO public.profiles (id, email, name, role)
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d480'::uuid,
  'admin@test.com', 
  'Admin User',
  'admin'
)
ON CONFLICT (id) DO NOTHING;