
import { Navigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/lib/auth';

/**
 * Redirects authenticated users without an org to /onboarding.
 * Super admins bypass this check.
 */
export function OrgGuard({ children }: { children: React.ReactNode }) {
  const { organization, isLoading, isSuperAdmin } = useOrganization();
  const { user, isLoading: authLoading } = useAuth();

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!organization && !isSuperAdmin) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
