INSERT INTO public.user_roles (user_id, role)
VALUES ('14313d1d-9790-40f2-bdc6-8ba5970cc106', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;