
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

interface OrganizationContextType {
  organization: Organization | null;
  membership: OrgMember | null;
  isLoading: boolean;
  isOrgAdmin: boolean;
  isSuperAdmin: boolean;
  members: OrgMember[];
  refreshOrg: () => Promise<void>;
  refreshMembers: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [membership, setMembership] = useState<OrgMember | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const loadOrganization = useCallback(async () => {
    if (!user) {
      setOrganization(null);
      setMembership(null);
      setMembers([]);
      setIsSuperAdmin(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Check super admin status
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .eq('role', 'super_admin')
        .maybeSingle();
      
      setIsSuperAdmin(!!roleData);

      // Get user's org membership
      const { data: memberData } = await supabase
        .from('organization_members')
        .select('*')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (memberData) {
        setMembership(memberData as OrgMember);

        // Fetch the organization
        const { data: orgData } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', memberData.organization_id)
          .single();

        if (orgData) {
          setOrganization(orgData as Organization);
        }
      } else {
        setMembership(null);
        setOrganization(null);
      }
    } catch (error) {
      console.error('Error loading organization:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const refreshMembers = useCallback(async () => {
    if (!organization) return;
    const { data } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', organization.id);
    setMembers((data || []) as OrgMember[]);
  }, [organization]);

  useEffect(() => {
    loadOrganization();
  }, [loadOrganization]);

  useEffect(() => {
    if (organization) {
      refreshMembers();
    }
  }, [organization, refreshMembers]);

  const isOrgAdmin = membership?.role === 'admin';

  return (
    <OrganizationContext.Provider value={{
      organization,
      membership,
      isLoading,
      isOrgAdmin,
      isSuperAdmin,
      members,
      refreshOrg: loadOrganization,
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
