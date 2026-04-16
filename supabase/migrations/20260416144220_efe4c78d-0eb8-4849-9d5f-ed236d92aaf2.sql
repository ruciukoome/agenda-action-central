
-- =============================================
-- MULTI-TENANT SAAS SCHEMA MIGRATION
-- =============================================

-- 1. Create enums
CREATE TYPE public.org_role AS ENUM ('admin', 'member');
CREATE TYPE public.subscription_plan AS ENUM ('free', 'basic', 'premium');
CREATE TYPE public.subscription_status AS ENUM ('active', 'expired', 'cancelled');
CREATE TYPE public.app_role AS ENUM ('super_admin');

-- 2. Create organizations table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 3. Create organization_members table
CREATE TABLE public.organization_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role public.org_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- 4. Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan public.subscription_plan NOT NULL DEFAULT 'free',
  status public.subscription_status NOT NULL DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 5. Create user_roles table (platform-level roles)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 6. Add organization_id to actions (nullable for existing data)
ALTER TABLE public.actions ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
CREATE INDEX idx_actions_organization_id ON public.actions(organization_id);

-- 7. Add updated_at triggers
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- SECURITY DEFINER HELPER FUNCTIONS
-- =============================================

-- Check if user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;

-- Check if user is member of an org
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND organization_id = _org_id
  )
$$;

-- Get user's role in an org
CREATE OR REPLACE FUNCTION public.get_user_org_role(_user_id UUID, _org_id UUID)
RETURNS public.org_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.organization_members
  WHERE user_id = _user_id AND organization_id = _org_id
  LIMIT 1
$$;

-- Get user's org id (first org they belong to)
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.organization_members
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- =============================================
-- RLS POLICIES: organizations
-- =============================================

-- Members can view their own org
CREATE POLICY "Members can view their organization"
ON public.organizations FOR SELECT TO authenticated
USING (public.is_org_member(auth.uid(), id) OR public.is_super_admin(auth.uid()));

-- Authenticated users can create orgs
CREATE POLICY "Authenticated users can create organizations"
ON public.organizations FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Org admins can update their org
CREATE POLICY "Org admins can update their organization"
ON public.organizations FOR UPDATE TO authenticated
USING (
  public.get_user_org_role(auth.uid(), id) = 'admin'
  OR public.is_super_admin(auth.uid())
);

-- Only super admins can delete orgs
CREATE POLICY "Super admins can delete organizations"
ON public.organizations FOR DELETE TO authenticated
USING (public.is_super_admin(auth.uid()));

-- =============================================
-- RLS POLICIES: organization_members
-- =============================================

-- Members can view other members in their org
CREATE POLICY "Members can view org members"
ON public.organization_members FOR SELECT TO authenticated
USING (
  public.is_org_member(auth.uid(), organization_id)
  OR public.is_super_admin(auth.uid())
);

-- Org admins can add members
CREATE POLICY "Org admins can add members"
ON public.organization_members FOR INSERT TO authenticated
WITH CHECK (
  public.get_user_org_role(auth.uid(), organization_id) = 'admin'
  OR public.is_super_admin(auth.uid())
  -- Allow the org creator to add themselves as first member
  OR (auth.uid() = user_id AND NOT EXISTS (
    SELECT 1 FROM public.organization_members WHERE organization_id = organization_members.organization_id
  ))
);

-- Org admins can update member roles
CREATE POLICY "Org admins can update members"
ON public.organization_members FOR UPDATE TO authenticated
USING (
  public.get_user_org_role(auth.uid(), organization_id) = 'admin'
  OR public.is_super_admin(auth.uid())
);

-- Org admins can remove members, users can leave
CREATE POLICY "Org admins can remove members or self-leave"
ON public.organization_members FOR DELETE TO authenticated
USING (
  public.get_user_org_role(auth.uid(), organization_id) = 'admin'
  OR auth.uid() = user_id
  OR public.is_super_admin(auth.uid())
);

-- =============================================
-- RLS POLICIES: subscriptions
-- =============================================

-- Org admins can view their subscription
CREATE POLICY "Org admins can view subscriptions"
ON public.subscriptions FOR SELECT TO authenticated
USING (
  public.get_user_org_role(auth.uid(), organization_id) = 'admin'
  OR public.is_super_admin(auth.uid())
);

-- Only super admins can manage subscriptions
CREATE POLICY "Super admins can create subscriptions"
ON public.subscriptions FOR INSERT TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update subscriptions"
ON public.subscriptions FOR UPDATE TO authenticated
USING (public.is_super_admin(auth.uid()));

-- =============================================
-- RLS POLICIES: user_roles
-- =============================================

-- Only super admins can view roles
CREATE POLICY "Super admins can view user roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.is_super_admin(auth.uid()) OR auth.uid() = user_id);

-- Only super admins can manage roles
CREATE POLICY "Super admins can manage user roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update user roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete user roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.is_super_admin(auth.uid()));

-- =============================================
-- UPDATED RLS POLICIES: actions
-- =============================================

-- Drop existing action policies
DROP POLICY IF EXISTS "Users can view their own actions" ON public.actions;
DROP POLICY IF EXISTS "Users can create their own actions" ON public.actions;
DROP POLICY IF EXISTS "Users can update their own actions" ON public.actions;
DROP POLICY IF EXISTS "Users can delete their own actions" ON public.actions;

-- New: org members can view all actions in their org
CREATE POLICY "Org members can view org actions"
ON public.actions FOR SELECT TO authenticated
USING (
  public.is_org_member(auth.uid(), organization_id)
  OR public.is_super_admin(auth.uid())
  -- Fallback for actions without org (legacy)
  OR (organization_id IS NULL AND auth.uid() = user_id)
);

-- Members can create actions in their org
CREATE POLICY "Org members can create actions"
ON public.actions FOR INSERT TO authenticated
WITH CHECK (
  (organization_id IS NOT NULL AND public.is_org_member(auth.uid(), organization_id) AND auth.uid() = user_id)
  -- Fallback for legacy
  OR (organization_id IS NULL AND auth.uid() = user_id)
);

-- Members can update their own actions, admins can update any in org
CREATE POLICY "Members update own or admins update any"
ON public.actions FOR UPDATE TO authenticated
USING (
  (organization_id IS NOT NULL AND (
    auth.uid() = user_id
    OR public.get_user_org_role(auth.uid(), organization_id) = 'admin'
  ) AND public.is_org_member(auth.uid(), organization_id))
  OR public.is_super_admin(auth.uid())
  OR (organization_id IS NULL AND auth.uid() = user_id)
);

-- Creators or admins can delete
CREATE POLICY "Creators or admins can delete actions"
ON public.actions FOR DELETE TO authenticated
USING (
  (organization_id IS NOT NULL AND (
    auth.uid() = user_id
    OR public.get_user_org_role(auth.uid(), organization_id) = 'admin'
  ) AND public.is_org_member(auth.uid(), organization_id))
  OR public.is_super_admin(auth.uid())
  OR (organization_id IS NULL AND auth.uid() = user_id)
);

-- Create a free subscription automatically when an org is created
CREATE OR REPLACE FUNCTION public.create_default_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (organization_id, plan, status)
  VALUES (NEW.id, 'free', 'active');
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_org_subscription
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.create_default_subscription();

-- Auto-add creator as admin member when org is created
CREATE OR REPLACE FUNCTION public.add_creator_as_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$$;

CREATE TRIGGER add_org_creator_as_admin
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.add_creator_as_admin();
