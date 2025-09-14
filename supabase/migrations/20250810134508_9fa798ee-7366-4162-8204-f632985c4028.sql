-- Clear existing role permissions
DELETE FROM public.role_permissions;

-- Insert new role permissions as specified

-- Admin role (has access to everything)
INSERT INTO public.role_permissions (role, route, can_access) VALUES
('admin', '/', true),
('admin', '/dashboard', true),
('admin', '/analytics', true),
('admin', '/doctors', true),
('admin', '/data-input', true),
('admin', '/reports', true),
('admin', '/analysis', true),
('admin', '/performance-report', true),
('admin', '/admin', true);

-- Physician role
INSERT INTO public.role_permissions (role, route, can_access) VALUES
('physician', '/', true),
('physician', '/dashboard', true),
('physician', '/analytics', true),
('physician', '/doctors', true),
('physician', '/data-input', false),
('physician', '/reports', false),
('physician', '/analysis', false),
('physician', '/performance-report', true),
('physician', '/admin', false);

-- Lab Manager role
INSERT INTO public.role_permissions (role, route, can_access) VALUES
('lab_manager', '/', true),
('lab_manager', '/dashboard', true),
('lab_manager', '/analytics', true),
('lab_manager', '/doctors', true),
('lab_manager', '/data-input', true),
('lab_manager', '/reports', true),
('lab_manager', '/analysis', true),
('lab_manager', '/performance-report', true),
('lab_manager', '/admin', false);

-- Judge role
INSERT INTO public.role_permissions (role, route, can_access) VALUES
('judge', '/', true),
('judge', '/dashboard', true),
('judge', '/analytics', true),
('judge', '/doctors', true),
('judge', '/data-input', false),
('judge', '/reports', true),
('judge', '/analysis', true),
('judge', '/performance-report', true),
('judge', '/admin', false);