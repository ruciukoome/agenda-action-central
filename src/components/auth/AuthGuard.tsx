
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/auth";

export const AuthGuard = () => {
  const { session, isLoading } = useAuth();

  // Show loading state if auth is still being checked
  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  // If not authenticated, redirect to login
  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  // Render child routes if authenticated
  return <Outlet />;
};
