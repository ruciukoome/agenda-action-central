
import { NavigationMenu, NavigationMenuList } from "@/components/ui/navigation-menu";
import { NavigationActions } from "./NavigationActions";
import { NavigationFilters } from "./NavigationFilters";

export function MainNavigation() {
  return (
    <NavigationMenu className="hidden sm:flex">
      <NavigationMenuList>
        <NavigationActions />
        <NavigationFilters />
      </NavigationMenuList>
    </NavigationMenu>
  );
}
