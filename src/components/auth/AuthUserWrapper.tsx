
import { ReactNode, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useNavigate, useLocation } from "react-router-dom";

interface AuthUserWrapperProps {
  children: ReactNode;
}

export const AuthUserWrapper = ({ children }: AuthUserWrapperProps) => {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Auto-redirect logged-in users away from auth page
    if (session && location.pathname === "/auth") {
      navigate("/dashboard");
    }
  }, [session, navigate, location.pathname]);

  return <>{children}</>;
};
