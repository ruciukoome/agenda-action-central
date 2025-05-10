
import { NavigationMenu, NavigationMenuList } from "@/components/ui/navigation-menu";
import { NavigationActions } from "./NavigationActions";
import { NavigationFilters } from "./NavigationFilters";
import { useIsMobile } from "@/hooks/use-mobile";

export function MainNavigation() {
  const isMobile = useIsMobile();
  
  // Don't render the navigation menu on mobile as it's handled by MobileMenu
  if (isMobile) return null;
  
  return (
    <NavigationMenu className="hidden sm:flex">
      <NavigationMenuList>
        <NavigationActions />
        <NavigationFilters />
      </NavigationMenuList>
    </NavigationMenu>
  );
}
