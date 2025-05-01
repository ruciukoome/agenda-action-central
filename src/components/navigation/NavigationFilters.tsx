
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { priorityOptions, progressStatusOptions, departmentOptions } from "@/lib/constants";

export function NavigationFilters() {
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger>Filters</NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
          <li className="col-span-1">
            <h2 className="mb-2 mt-1 text-lg font-semibold">Priority</h2>
            <ul className="space-y-1">
              {priorityOptions.map((option) => (
                <li key={option.value}>
                  <NavigationMenuLink asChild>
                    <a
                      href="#"
                      className="block select-none rounded-md p-3 leading-none no-underline outline-none focus:shadow-md hover:bg-accent hover:text-accent-foreground"
                    >
                      <div className="text-sm font-medium">{option.label}</div>
                      <p className="text-sm leading-snug text-muted-foreground">
                        Filter actions by {option.label.toLowerCase()} priority.
                      </p>
                    </a>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </li>
          <li className="col-span-1">
            <h2 className="mb-2 mt-1 text-lg font-semibold">Progress</h2>
            <ul className="space-y-1">
              {progressStatusOptions.map((option) => (
                <li key={option.value}>
                  <NavigationMenuLink asChild>
                    <a
                      href="#"
                      className="block select-none rounded-md p-3 leading-none no-underline outline-none focus:shadow-md hover:bg-accent hover:text-accent-foreground"
                    >
                      <div className="text-sm font-medium">{option.label}</div>
                      <p className="text-sm leading-snug text-muted-foreground">
                        Show actions with {option.label.toLowerCase()} progress.
                      </p>
                    </a>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </li>
          <li className="col-span-2">
            <h2 className="mb-2 mt-1 text-lg font-semibold">Department</h2>
            <ul className="space-y-1 grid grid-cols-2 gap-x-2">
              {departmentOptions.map((option) => (
                <li key={option.value}>
                  <NavigationMenuLink asChild>
                    <a
                      href="#"
                      className="block select-none rounded-md p-3 leading-none outline-none focus:shadow-md hover:bg-accent hover:text-accent-foreground"
                    >
                      <div className="text-sm font-medium">{option.label}</div>
                    </a>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}
