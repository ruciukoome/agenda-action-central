
import { Route, Routes } from 'react-router-dom';
import './App.css';
import { Toaster } from 'sonner';
import Index from './pages/Index';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import ManagedActions from './pages/ManagedActions';
import AddAction from './pages/AddAction';
import EditAction from './pages/EditAction';
import NotFound from './pages/NotFound';
import MyActions from './pages/MyActions';
import DatabaseSetup from './pages/DatabaseSetup';
import { useIdleTimeout } from './hooks/useIdleTimeout';
import { useAuth } from '@/lib/auth';

function App() {
  // Mock user email for development purposes
  const mockUserEmail = "user@example.com";
  
  // Set up idle timeout - will only be active when user is logged in
  const { user } = useAuth();
  useIdleTimeout(user ? 10 * 60 * 1000 : undefined); // 10 minutes
  
  const handleEditAction = (action: any) => {
    console.log("Edit action:", action);
    // This would be handled by the router in a real app
  };
  
  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/managed-actions" element={<ManagedActions />} />
        <Route path="/manage-actions" element={<ManagedActions />} /> {/* Add this route to fix the navigation */}
        <Route path="/add-action" element={<AddAction />} />
        <Route path="/add" element={<AddAction />} />
        <Route path="/edit-action/:id" element={<EditAction />} />
        <Route path="/edit/:id" element={<EditAction />} />
        <Route path="/my-actions" element={<MyActions userEmail={mockUserEmail} onEditAction={handleEditAction} />} />
        <Route path="/database-setup" element={<DatabaseSetup />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster 
        position="top-right"
        expand={false}
        closeButton
        richColors
        duration={3000}
        className="fixed-toast"
        toastOptions={{
          style: {
            position: 'relative' // Prevent layout shifts
          }
        }}
      />
    </>
  );
}

export default App;
