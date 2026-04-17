
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "@/lib/toast-wrapper";
import { Settings, Building2, Shield } from "lucide-react";

export function UserMenu() {
  const { signOut, session } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out", {
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      toast.error("Error signing out", {
        description: "There was an error signing you out. Please try again.",
      });
    }
  };

  if (!session?.user) {
    return (
      <Link to="/auth">
        <Button variant="outline" size="sm">
          Sign In
        </Button>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session?.user?.user_metadata?.avatar_url || ""} alt={session?.user?.email || "Avatar"} />
            <AvatarFallback>{session?.user?.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="absolute right-0 mt-2 w-40">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Link to="/my-actions" className="w-full">
            My Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link to="/settings" className="w-full flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
