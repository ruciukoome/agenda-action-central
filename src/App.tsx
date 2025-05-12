
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import MyActions from "@/pages/MyActions";
import AddAction from "@/pages/AddAction";
import ManagedActions from "@/pages/ManagedActions";
import EditAction from "@/pages/EditAction";
import NotFound from "@/pages/NotFound";
import DatabaseSetup from "@/pages/DatabaseSetup";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AuthUserWrapper } from "@/components/auth/AuthUserWrapper";
import UpdateTask from "@/pages/UpdateTask";
import UpdateSuccess from "@/pages/UpdateSuccess";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthUserWrapper>
        <Routes>
          <Route path="/" element={<div>Home Page</div>} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Public routes that don't require authentication */}
          <Route path="/update-task/:id" element={<UpdateTask />} />
          <Route path="/update-success" element={<UpdateSuccess />} />
          
          {/* Protected routes that require authentication */}
          <Route element={<AuthGuard />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/my-actions" element={<MyActions />} />
            <Route path="/add-action" element={<AddAction />} />
            <Route path="/managed-actions" element={<ManagedActions />} />
            <Route path="/edit-action/:id" element={<EditAction />} />
            <Route path="/database-setup" element={<DatabaseSetup />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthUserWrapper>
    </QueryClientProvider>
  );
}

export default App;
