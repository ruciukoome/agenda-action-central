
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { AuthGuard } from "@/components/AuthGuard";
import { AuthUserWrapper } from "@/components/AuthUserWrapper";
import Index from "./pages/Index";
import AddAction from "./pages/AddAction";
import EditAction from "./pages/EditAction";
import MyActions from "./pages/MyActions";
import ManagedActions from "./pages/ManagedActions";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { TestEmailNotification } from "@/components/TestEmailNotification";

const queryClient = new QueryClient();

const App = () => {
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
                    <AddAction />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/edit/:id" 
                element={
                  <AuthGuard>
                    <EditAction />
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
                          userEmail={userEmail}
                          onEditAction={(action) => {}}
                        />
                      )}
                    </AuthUserWrapper>
                  </AuthGuard>
                } 
              />
              <Route 
                path="/manage-actions" 
                element={
                  <AuthGuard>
                    <ManagedActions />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/test-email" 
                element={
                  <AuthGuard>
                    <div className="container py-8">
                      <h1 className="text-2xl font-bold mb-6">Email Notification Test</h1>
                      <TestEmailNotification />
                    </div>
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
