
import { ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { Navigate } from 'react-router-dom';

interface AuthUserWrapperProps {
  children: (userEmail: string) => ReactNode;
}

export function AuthUserWrapper({ children }: AuthUserWrapperProps) {
  const { user } = useAuth();
  
  if (!user || !user.email) {
    return <Navigate to="/auth" />;
  }
  
  return <>{children(user.email)}</>;
}
