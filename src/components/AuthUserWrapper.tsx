
import { ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { Navigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthUserWrapperProps {
  children: (userEmail: string) => ReactNode;
}

export function AuthUserWrapper({ children }: AuthUserWrapperProps) {
  const { user, isLoading } = useAuth();
  
  // Show loading state while auth is initializing
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-[300px] space-y-4">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }
  
  // Redirect to auth page if not authenticated
  if (!user || !user.email) {
    return <Navigate to="/auth" />;
  }
  
  return <>{children(user.email)}</>;
}
