
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

function App() {
  // Mock user email for development purposes
  const mockUserEmail = "user@example.com";
  
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
        <Route path="/add-action" element={<AddAction />} />
        <Route path="/add" element={<AddAction />} /> {/* Add this route to match "/add" */}
        <Route path="/edit-action/:id" element={<EditAction />} />
        <Route path="/my-actions" element={<MyActions userEmail={mockUserEmail} onEditAction={handleEditAction} />} />
        <Route path="/database-setup" element={<DatabaseSetup />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
