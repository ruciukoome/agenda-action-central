
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { X, Home, ClipboardList, PlusCircle, Database, LogOut } from "lucide-react";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSignOut: () => Promise<void>;
}

export function MobileMenu({ isOpen, onClose, onSignOut }: MobileMenuProps) {
  const { session } = useAuth();
  const location = useLocation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-y-0 right-0 w-3/4 max-w-sm bg-background p-6 shadow-lg">
        <div className="mb-4 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <ul className="flex flex-col space-y-4">
          <li>
            <Link 
              to="/dashboard" 
              className={`flex items-center gap-2 px-4 py-2 rounded ${location.pathname === '/dashboard' ? 'bg-primary/10 text-primary' : 'bg-card hover:bg-accent hover:text-accent-foreground'}`}
              onClick={onClose}
            >
              <Home className="h-4 w-4" /> Dashboard
            </Link>
          </li>
          <li>
            <Link 
              to="/" 
              className={`flex items-center gap-2 px-4 py-2 rounded ${location.pathname === '/' ? 'bg-primary/10 text-primary' : 'bg-card hover:bg-accent hover:text-accent-foreground'}`}
              onClick={onClose}
            >
              <ClipboardList className="h-4 w-4" /> My Actions
            </Link>
          </li>
          <li>
            <Link 
              to="/add-action" 
              className={`flex items-center gap-2 px-4 py-2 rounded ${location.pathname === '/add-action' ? 'bg-primary/10 text-primary' : 'bg-card hover:bg-accent hover:text-accent-foreground'}`}
              onClick={onClose}
            >
              <PlusCircle className="h-4 w-4" /> Add Action
            </Link>
          </li>
          <li>
            <Link 
              to="/managed-actions" 
              className={`flex items-center gap-2 px-4 py-2 rounded ${location.pathname === '/managed-actions' ? 'bg-primary/10 text-primary' : 'bg-card hover:bg-accent hover:text-accent-foreground'}`}
              onClick={onClose}
            >
              <ClipboardList className="h-4 w-4" /> Actions
            </Link>
          </li>
          <li>
            <Link 
              to="/database-setup" 
              className={`flex items-center gap-2 px-4 py-2 rounded font-bold ${location.pathname === '/database-setup' ? 'bg-primary/10 text-primary' : 'bg-card hover:bg-accent hover:text-accent-foreground'}`}
              onClick={onClose}
            >
              <Database className="h-4 w-4" /> Database Setup
            </Link>
          </li>
          {session?.user && (
            <li className="mt-4">
              <Button 
                variant="outline" 
                className="w-full flex items-center gap-2" 
                onClick={() => { onSignOut(); onClose(); }}
              >
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
