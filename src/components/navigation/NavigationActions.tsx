
import { Link, useLocation } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

export function NavigationActions() {
  const location = useLocation();
  
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className={location.pathname.includes('/action') ? 'bg-accent/50' : ''}>Actions</NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] md:grid-cols-2">
          <li className="row-span-3">
            <NavigationMenuLink asChild>
              <Link
                to="/managed-actions"
                className="relative flex aspect-square items-center justify-center rounded-md bg-gradient-to-br from-sky-500 to-violet-500 text-white no-underline outline-none focus:shadow-md"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-8 w-8"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6.042A8.967 8.967 0 006 3.062c-2.495 0-4.45 2.03-4.45 4.529 0 1.433.6 2.94 1.522 3.94"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6.042A8.967 8.967 0 0118 3.062c2.495 0 4.45 2.03 4.45 4.529 0 1.433-.6 2.94-1.522 3.94"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6.042V13.5a3 3 0 003-3V6.042c0-1.667-1.333-3-3-3z"
                  />
                </svg>
                <div className="absolute bottom-0 left-0 right-0 rounded-md bg-muted p-2 text-center text-xs font-medium">
                  Action Items
                </div>
              </Link>
            </NavigationMenuLink>
          </li>
          <li>
            <NavigationMenuLink asChild>
              <Link to="/my-actions" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none focus:shadow-md hover:bg-accent hover:text-accent-foreground">
                <div className="text-sm font-medium">My Actions</div>
                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                  View and manage actions assigned to you.
                </p>
              </Link>
            </NavigationMenuLink>
          </li>
          <li>
            <NavigationMenuLink asChild>
              <Link to="/add-action" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none focus:shadow-md hover:bg-accent hover:text-accent-foreground">
                <div className="text-sm font-medium">Add Action</div>
                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                  Create a new action item.
                </p>
              </Link>
            </NavigationMenuLink>
          </li>
          <li>
            <NavigationMenuLink asChild>
              <Link to="/managed-actions" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none focus:shadow-md hover:bg-accent hover:text-accent-foreground">
                <div className="text-sm font-medium">Manage Actions</div>
                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                  Delete or export selected actions in tabular format.
                </p>
              </Link>
            </NavigationMenuLink>
          </li>
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}
