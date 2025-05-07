
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
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-y-0 right-0 w-3/4 max-w-sm bg-background p-6 shadow-lg">
        <div className="mb-4 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
        <ul className="flex flex-col space-y-4">
          <li>
            <Link to="/dashboard" className="block px-4 py-2 rounded hover:bg-accent hover:text-accent-foreground" onClick={onClose}>
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/my-actions" className="block px-4 py-2 rounded hover:bg-accent hover:text-accent-foreground" onClick={onClose}>
              My Actions
            </Link>
          </li>
          <li>
            <Link to="/add-action" className="block px-4 py-2 rounded hover:bg-accent hover:text-accent-foreground" onClick={onClose}>
              Add Action
            </Link>
          </li>
          <li>
            <Link to="/managed-actions" className="block px-4 py-2 rounded hover:bg-accent hover:text-accent-foreground" onClick={onClose}>
              Actions
            </Link>
          </li>
          <li>
            <Link to="/database-setup" className="block px-4 py-2 rounded font-bold hover:bg-accent hover:text-accent-foreground" onClick={onClose}>
              Database Setup
            </Link>
          </li>
          {session?.user && (
            <li className="mt-4">
              <Button variant="outline" className="w-full" onClick={() => { onSignOut(); onClose(); }}>
                Sign out
              </Button>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
