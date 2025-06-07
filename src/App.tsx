
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
import UpdateTask from './pages/UpdateTask';
import UpdateSuccess from './pages/UpdateSuccess';
import DatabaseSetup from './pages/DatabaseSetup';
import Settings from './pages/Settings';
import { useIdleTimeout } from './hooks/useIdleTimeout';
import { useAuth } from '@/lib/auth';
import { AuthGuard } from '@/components/AuthGuard';
import { ToastSettingsProvider } from '@/contexts/ToastSettingsContext';

function App() {
  // Set up idle timeout - will only be active when user is logged in
  const { user } = useAuth();
  useIdleTimeout(user ? 10 * 60 * 1000 : undefined); // 10 minutes
  
  return (
    <ToastSettingsProvider>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        
        {/* Public routes that don't require authentication */}
        <Route path="/update-task/:id" element={<UpdateTask />} />
        <Route path="/update-success" element={<UpdateSuccess />} />
        
        {/* Protected routes that require authentication */}
        <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
        <Route path="/managed-actions" element={<AuthGuard><ManagedActions /></AuthGuard>} />
        <Route path="/manage-actions" element={<AuthGuard><ManagedActions /></AuthGuard>} />
        <Route path="/action-items" element={<AuthGuard><MyActions /></AuthGuard>} />
        <Route path="/add-action" element={<AuthGuard><AddAction /></AuthGuard>} />
        <Route path="/add" element={<AuthGuard><AddAction /></AuthGuard>} />
        <Route path="/edit-action/:id" element={<AuthGuard><EditAction /></AuthGuard>} />
        <Route path="/edit/:id" element={<AuthGuard><EditAction /></AuthGuard>} />
        <Route path="/my-actions" element={<AuthGuard><MyActions /></AuthGuard>} />
        <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />
        <Route path="/database-setup" element={<AuthGuard><DatabaseSetup /></AuthGuard>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster 
        position="top-right"
        expand={false}
        closeButton
        richColors
        duration={3000}
        style={{
          position: 'fixed',
          zIndex: 9999,
          top: 16,
          right: 16,
          margin: 0,
          padding: 0,
          transform: 'none'
        }}
        className="fixed-toast"
        toastOptions={{
          style: {
            position: 'relative',
            transform: 'none',
            transition: 'opacity 0.2s ease-out'
          }
        }}
      />
    </ToastSettingsProvider>
  );
}

export default App;
