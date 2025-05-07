
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UserMenu } from "@/components/navigation/UserMenu";
import { MobileMenu } from "@/components/navigation/MobileMenu";
import { MainNavigation } from "@/components/navigation/MainNavigation";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export function Header() {
  // Check if the user is on a mobile device
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSignOut = async () => {
    // This is a placeholder for the actual sign out functionality
    console.log("Sign out");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <MainNavigation />
        <div className="ml-auto flex items-center space-x-2">
          {/* Navigation links for bigger screens */}
          {!isMobile && (
            <nav className="flex items-center space-x-2">
              <Link
                to="/dashboard"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Dashboard
              </Link>
              <Link
                to="/my-actions"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                My Actions
              </Link>
              <Link
                to="/managed-actions"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Actions
              </Link>
              <Link
                to="/database-setup"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary font-bold" /* Bold to make it stand out */
              >
                Database Setup
              </Link>
            </nav>
          )}
          {/* User menu for all screen sizes */}
          {isMobile ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              {mobileMenuOpen && (
                <MobileMenu
                  isOpen={mobileMenuOpen}
                  onClose={() => setMobileMenuOpen(false)}
                  onSignOut={handleSignOut}
                />
              )}
            </>
          ) : (
            <UserMenu />
          )}
        </div>
      </div>
    </header>
  );
}
