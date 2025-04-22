
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { AuthGuard } from "@/components/AuthGuard";
import { AuthUserWrapper } from "@/components/AuthUserWrapper";
import { useState } from "react";
import { ActionItem } from "@/types/action";
import { mockActions } from "@/data/mockActions";
import Index from "./pages/Index";
import AddAction from "./pages/AddAction";
import EditAction from "./pages/EditAction";
import MyActions from "./pages/MyActions";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [actions, setActions] = useState<ActionItem[]>(mockActions);
  
  const handleAddAction = (action: ActionItem) => {
    setActions([action, ...actions]);
  };
  
  const handleUpdateAction = (updatedAction: ActionItem) => {
    setActions(actions.map(action => 
      action.id === updatedAction.id ? updatedAction : action
    ));
  };
  
  const handleEditAction = (action: ActionItem) => {
    // This function is passed to components that need to trigger navigation to edit page
    // The actual navigation happens in the components
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<AuthGuard><Index /></AuthGuard>} />
              <Route 
                path="/add" 
                element={
                  <AuthGuard>
                    <AddAction onAddAction={handleAddAction} />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/edit/:id" 
                element={
                  <AuthGuard>
                    <EditAction 
                      actions={actions} 
                      onUpdateAction={handleUpdateAction} 
                    />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/my-actions" 
                element={
                  <AuthGuard>
                    <AuthUserWrapper>
                      {(userEmail) => (
                        <MyActions 
                          actions={actions} 
                          userEmail={userEmail}
                          onEditAction={handleEditAction} 
                        />
                      )}
                    </AuthUserWrapper>
                  </AuthGuard>
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
