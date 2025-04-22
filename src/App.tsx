
import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AddAction from "./pages/AddAction";
import EditAction from "./pages/EditAction";
import MyActions from "./pages/MyActions";
import NotFound from "./pages/NotFound";
import { ActionItem } from "./types/action";
import { mockActions } from "./data/mockActions";

const queryClient = new QueryClient();

const App = () => {
  const [actions, setActions] = useState<ActionItem[]>(mockActions);
  const [currentUserEmail] = useState<string>("james.wilson@example.com");
  
  const handleAddAction = (action: ActionItem) => {
    setActions([action, ...actions]);
  };
  
  const handleUpdateAction = (updatedAction: ActionItem) => {
    setActions(actions.map(action => 
      action.id === updatedAction.id ? updatedAction : action
    ));
  };
  
  const handleEditAction = (action: ActionItem) => {
    // This will be used to navigate to the edit page
    console.log("Edit action:", action.id);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route 
              path="/add" 
              element={<AddAction onAddAction={handleAddAction} />} 
            />
            <Route 
              path="/edit/:id" 
              element={
                <EditAction 
                  actions={actions} 
                  onUpdateAction={handleUpdateAction} 
                />
              } 
            />
            <Route 
              path="/my-actions" 
              element={
                <MyActions 
                  actions={actions}
                  userEmail={currentUserEmail}
                  onEditAction={handleEditAction}
                />
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
