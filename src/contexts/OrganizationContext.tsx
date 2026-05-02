import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export type OrgRole = 'admin' | 'member';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_by: string;
  created_at: string;
}

export interface OrgMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgRole;
  created_at: string;
}

export interface UserMembership extends OrgMember {
  organization: Organization;
}

interface OrganizationContextType {
  organization: Organization | null;
  membership: OrgMember | null;
  memberships: UserMembership[];
  isLoading: boolean;
  isOrgAdmin: boolean;
  isSuperAdmin: boolean;
  members: OrgMember[];
  switchOrganization: (organizationId: string) => void;
  refreshOrg: () => Promise<void>;
  refreshMembers: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

const CURRENT_ORG_KEY = 'currentOrganizationId';

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [memberships, setMemberships] = useState<UserMembership[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(
    () => localStorage.getItem(CURRENT_ORG_KEY)
  );
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const loadMemberships = useCallback(async () => {
    if (!user) {
      setMemberships([]);
      setMembers([]);
      setIsSuperAdmin(false);
      setCurrentOrgId(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .eq('role', 'super_admin')
        .maybeSingle();
      setIsSuperAdmin(!!roleData);

      const { data: memberData } = await supabase
        .from('organization_members')
        .select('*, organization:organizations(*)')
        .eq('user_id', user.id);

      const memberships = ((memberData || []) as unknown as UserMembership[])
        .filter((m) => m.organization);
      setMemberships(memberships);

      // Pick a current org: persisted, or first available
      const storedId = localStorage.getItem(CURRENT_ORG_KEY);
      const validStored = memberships.find((m) => m.organization_id === storedId);
      const next = validStored ?? memberships[0] ?? null;
      const nextId = next?.organization_id ?? null;
      setCurrentOrgId(nextId);
      if (nextId) localStorage.setItem(CURRENT_ORG_KEY, nextId);
      else localStorage.removeItem(CURRENT_ORG_KEY);
    } catch (error) {
      console.error('Error loading organization memberships:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const current = memberships.find((m) => m.organization_id === currentOrgId) ?? null;
  const organization = current?.organization ?? null;
  const membership: OrgMember | null = current
    ? {
        id: current.id,
        organization_id: current.organization_id,
        user_id: current.user_id,
        role: current.role,
        created_at: current.created_at,
      }
    : null;

  const refreshMembers = useCallback(async () => {
    if (!organization) return;
    const { data } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', organization.id);
    setMembers((data || []) as OrgMember[]);
  }, [organization]);

  const switchOrganization = useCallback((organizationId: string) => {
    const found = memberships.find((m) => m.organization_id === organizationId);
    if (!found) return;
    setCurrentOrgId(organizationId);
    localStorage.setItem(CURRENT_ORG_KEY, organizationId);
  }, [memberships]);

  useEffect(() => {
    loadMemberships();
  }, [loadMemberships]);

  useEffect(() => {
    if (organization) refreshMembers();
  }, [organization, refreshMembers]);

  const isOrgAdmin = membership?.role === 'admin';

  return (
    <OrganizationContext.Provider value={{
      organization,
      membership,
      memberships,
      isLoading,
      isOrgAdmin,
      isSuperAdmin,
      members,
      switchOrganization,
      refreshOrg: loadMemberships,
      refreshMembers,
    }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};
