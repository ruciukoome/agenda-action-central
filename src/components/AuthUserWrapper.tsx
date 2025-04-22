
import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Navigate } from 'react-router-dom';

interface AuthUserWrapperProps {
  children: (userEmail: string) => ReactNode;
}

export function AuthUserWrapper({ children }: AuthUserWrapperProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Give auth a moment to initialize
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Show loading state while auth is initializing
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  // Redirect to auth page if not authenticated
  if (!user || !user.email) {
    return <Navigate to="/auth" />;
  }
  
  return <>{children(user.email)}</>;
}
