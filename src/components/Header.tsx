
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { UserMenu } from "@/components/navigation/UserMenu";
import { MobileMenu } from "@/components/navigation/MobileMenu";
import { MainNavigation } from "@/components/navigation/MainNavigation";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export function Header() {
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const handleSignOut = async () => {
    // This is a placeholder for the actual sign out functionality
    console.log("Sign out");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
        
        <MainNavigation />
        
        <div className="ml-auto flex items-center space-x-2">
          {/* Navigation links for bigger screens */}
          {!isMobile && (
            <nav className="hidden md:flex items-center space-x-4">
              <Link
                to="/dashboard"
                className={`text-sm font-medium ${location.pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"} transition-colors hover:text-primary`}
              >
                Dashboard
              </Link>
              <Link
                to="/my-actions"
                className={`text-sm font-medium ${location.pathname === "/my-actions" ? "text-primary" : "text-muted-foreground"} transition-colors hover:text-primary`}
              >
                My Actions
              </Link>
              <Link
                to="/managed-actions"
                className={`text-sm font-medium ${location.pathname === "/managed-actions" ? "text-primary" : "text-muted-foreground"} transition-colors hover:text-primary`}
              >
                Actions
              </Link>
              <Link
                to="/database-setup"
                className={`text-sm font-medium ${location.pathname === "/database-setup" ? "text-primary" : "text-muted-foreground"} transition-colors hover:text-primary font-bold`}
              >
                Database Setup
              </Link>
            </nav>
          )}
          
          {/* User menu for all screen sizes */}
          <UserMenu />
          
          {/* Mobile menu */}
          {mobileMenuOpen && (
            <MobileMenu
              isOpen={mobileMenuOpen}
              onClose={() => setMobileMenuOpen(false)}
              onSignOut={handleSignOut}
            />
          )}
        </div>
      </div>
    </header>
  );
}
