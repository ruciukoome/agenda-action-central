import { useState } from "react";
import { useAuth } from "@/lib/auth";
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
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { priorityOptions, progressStatusOptions, departmentOptions } from "@/lib/constants";
import { Link } from "react-router-dom";

export function Header() {
  const { signOut, session } = useAuth();
  const { toast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "There was an error signing you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="bg-background sticky top-0 z-40 w-full border-b">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <NavigationMenu className="hidden sm:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Actions</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] md:grid-cols-2">
                  <li className="row-span-3">
                    <NavigationMenuLink asChild>
                      <a
                        className="relative flex aspect-square items-center justify-center rounded-md bg-gradient-to-br from-sky-500 to-violet-500 text-white no-underline outline-none focus:shadow-md"
                        href="/"
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
                      </a>
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
                      <Link to="/add" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none focus:shadow-md hover:bg-accent hover:text-accent-foreground">
                        <div className="text-sm font-medium">Add Action</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Create a new action item.
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link to="/manage-actions" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none focus:shadow-md hover:bg-accent hover:text-accent-foreground">
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
                  <li className="col-span-1">
                    <h2 className="mb-2 mt-1 text-lg font-semibold">Department</h2>
                    <ul className="space-y-1">
                      {departmentOptions.map((option) => (
                        <li key={option.value}>
                          <NavigationMenuLink asChild>
                            <a
                              href="#"
                              className="block select-none rounded-md p-3 leading-none outline-none focus:shadow-md hover:bg-accent hover:text-accent-foreground"
                            >
                              <div className="text-sm font-medium">{option.label}</div>
                              <p className="text-sm leading-snug text-muted-foreground">
                                View actions related to the {option.label.toLowerCase()} department.
                              </p>
                            </a>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        <Button variant="outline" size="sm" className="ml-auto sm:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          Menu
        </Button>
        {session?.user ? (
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
                <Link to="/my-actions">
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link to="/auth">
            <Button variant="outline" size="sm" >
              Sign In
            </Button>
          </Link>
        )}
      </div>
      {isMenuOpen && (
        <div className="container py-2 sm:hidden">
          <ul className="flex flex-col space-y-2">
            <li>
              <Link to="/" className="block px-4 py-2 rounded hover:bg-accent hover:text-accent-foreground">
                Actions
              </Link>
            </li>
            <li>
              <Link to="/my-actions" className="block px-4 py-2 rounded hover:bg-accent hover:text-accent-foreground">
                My Actions
              </Link>
            </li>
            <li>
              <Link to="/add" className="block px-4 py-2 rounded hover:bg-accent hover:text-accent-foreground">
                Add Action
              </Link>
            </li>
            <li>
              <Link to="/manage-actions" className="block px-4 py-2 rounded hover:bg-accent hover:text-accent-foreground">
                Manage Actions
              </Link>
            </li>
            <li>
              <Button variant="outline" onClick={handleSignOut}>Sign out</Button>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
