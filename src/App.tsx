import { Route, Routes } from 'react-router-dom';
import './App.css';
import { Toaster } from 'sonner';
import Index from './pages/Index';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import ManagedActions from './pages/ManagedActions';
import AddAction from './pages/AddAction';
import EditAction from './pages/EditAction';
import NotFound from './pages/NotFound';
import MyActions from './pages/MyActions';
import UpdateTask from './pages/UpdateTask';
import UpdateSuccess from './pages/UpdateSuccess';
import RespondAction from './pages/RespondAction';
import Settings from './pages/Settings';
import Onboarding from './pages/Onboarding';
import OrganizationSettings from './pages/OrganizationSettings';
import SuperAdmin from './pages/SuperAdmin';
import UsersAndRoles from './pages/UsersAndRoles';
import Drafts from './pages/Drafts';
import { useIdleTimeout } from './hooks/useIdleTimeout';
import { useAuth } from '@/lib/auth';
import { AuthGuard } from '@/components/AuthGuard';
import { OrgGuard } from '@/components/OrgGuard';
import { ToastSettingsProvider, useToastSettings } from '@/contexts/ToastSettingsContext';
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import { PointerEventsGuard } from '@/components/PointerEventsGuard';

function AppContent() {
  const { user } = useAuth();
  const { toastsEnabled } = useToastSettings();
  useIdleTimeout(user ? 10 * 60 * 1000 : undefined);
  
  return (
    <>
      <PointerEventsGuard />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<OrgGuard><Index /></OrgGuard>} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/onboarding" element={<AuthGuard><Onboarding /></AuthGuard>} />
        
        {/* Public routes */}
        <Route path="/update-task/:id" element={<UpdateTask />} />
        <Route path="/update-success" element={<UpdateSuccess />} />
        <Route path="/respond/:actionId" element={<RespondAction />} />
        
        {/* Protected routes requiring auth + org */}
        <Route path="/dashboard" element={<AuthGuard><OrgGuard><Dashboard /></OrgGuard></AuthGuard>} />
        <Route path="/managed-actions" element={<AuthGuard><OrgGuard><ManagedActions /></OrgGuard></AuthGuard>} />
        <Route path="/manage-actions" element={<AuthGuard><OrgGuard><ManagedActions /></OrgGuard></AuthGuard>} />
        <Route path="/action-items" element={<AuthGuard><OrgGuard><MyActions /></OrgGuard></AuthGuard>} />
        <Route path="/add-action" element={<AuthGuard><OrgGuard><AddAction /></OrgGuard></AuthGuard>} />
        <Route path="/drafts" element={<AuthGuard><OrgGuard><Drafts /></OrgGuard></AuthGuard>} />
        <Route path="/add" element={<AuthGuard><OrgGuard><AddAction /></OrgGuard></AuthGuard>} />
        <Route path="/edit-action/:id" element={<AuthGuard><OrgGuard><EditAction /></OrgGuard></AuthGuard>} />
        <Route path="/edit/:id" element={<AuthGuard><OrgGuard><EditAction /></OrgGuard></AuthGuard>} />
        <Route path="/my-actions" element={<AuthGuard><OrgGuard><MyActions /></OrgGuard></AuthGuard>} />
        <Route path="/settings" element={<AuthGuard><OrgGuard><Settings /></OrgGuard></AuthGuard>} />
        
        <Route path="/organization" element={<AuthGuard><OrgGuard><OrganizationSettings /></OrgGuard></AuthGuard>} />
        <Route path="/super-admin" element={<AuthGuard><SuperAdmin /></AuthGuard>} />
        <Route path="/super-admin/users" element={<AuthGuard><UsersAndRoles /></AuthGuard>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {toastsEnabled && (
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
      )}
    </>
  );
}

function App() {
  return (
    <ToastSettingsProvider>
      <OrganizationProvider>
        <AppContent />
      </OrganizationProvider>
    </ToastSettingsProvider>
  );
}

export default App;
