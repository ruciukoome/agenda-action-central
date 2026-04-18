INSERT INTO public.user_roles (user_id, role)
VALUES ('e75bbe29-6396-4a71-bbf9-85861473894f', 'super_admin')
ON CONFLICT DO NOTHING;