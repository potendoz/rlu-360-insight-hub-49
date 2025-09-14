-- Create role_permissions table to manage what pages each role can access
CREATE TABLE public.role_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role text NOT NULL,
  route text NOT NULL,
  can_access boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(role, route)
);

-- Enable RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view role permissions" 
ON public.role_permissions FOR SELECT 
USING (true);

CREATE POLICY "Admin users can manage role permissions" 
ON public.role_permissions FOR ALL 
USING (has_role('admin'::text))
WITH CHECK (has_role('admin'::text));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_role_permissions_updated_at
BEFORE UPDATE ON public.role_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default permissions for all roles and routes
INSERT INTO public.role_permissions (role, route, can_access) VALUES
-- Admin role (has access to everything)
('admin', '/', true),
('admin', '/dashboard', true),
('admin', '/analytics', true),
('admin', '/doctors', true),
('admin', '/data-input', true),
('admin', '/reports', true),
('admin', '/analysis', true),
('admin', '/performance-report', true),
('admin', '/admin', true),

-- Physician role
('physician', '/', true),
('physician', '/dashboard', true),
('physician', '/analytics', false),
('physician', '/doctors', true),
('physician', '/data-input', false),
('physician', '/reports', true),
('physician', '/analysis', false),
('physician', '/performance-report', true),
('physician', '/admin', false),

-- Lab Manager role
('lab_manager', '/', true),
('lab_manager', '/dashboard', true),
('lab_manager', '/analytics', true),
('lab_manager', '/doctors', true),
('lab_manager', '/data-input', true),
('lab_manager', '/reports', true),
('lab_manager', '/analysis', true),
('lab_manager', '/performance-report', true),
('lab_manager', '/admin', false),

-- Judge role
('judge', '/', true),
('judge', '/dashboard', true),
('judge', '/analytics', true),
('judge', '/doctors', true),
('judge', '/data-input', false),
('judge', '/reports', true),
('judge', '/analysis', true),
('judge', '/performance-report', true),
('judge', '/admin', false);