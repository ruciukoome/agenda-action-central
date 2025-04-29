
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSignOut: () => Promise<void>;
}

export function MobileMenu({ isOpen, onClose, onSignOut }: MobileMenuProps) {
  const { session } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="container py-2 sm:hidden">
      <ul className="flex flex-col space-y-2">
        <li>
          <Link to="/" className="block px-4 py-2 rounded hover:bg-accent hover:text-accent-foreground" onClick={onClose}>
            Actions
          </Link>
        </li>
        <li>
          <Link to="/my-actions" className="block px-4 py-2 rounded hover:bg-accent hover:text-accent-foreground" onClick={onClose}>
            My Actions
          </Link>
        </li>
        <li>
          <Link to="/add" className="block px-4 py-2 rounded hover:bg-accent hover:text-accent-foreground" onClick={onClose}>
            Add Action
          </Link>
        </li>
        <li>
          <Link to="/manage-actions" className="block px-4 py-2 rounded hover:bg-accent hover:text-accent-foreground" onClick={onClose}>
            Manage Actions
          </Link>
        </li>
        {session?.user && (
          <li>
            <Button variant="outline" onClick={onSignOut}>Sign out</Button>
          </li>
        )}
      </ul>
    </div>
  );
}
