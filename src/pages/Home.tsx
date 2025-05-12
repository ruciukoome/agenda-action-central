
import { Header } from "@/components/Header";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ListTodo, Plus, LayoutDashboard } from "lucide-react";

export default function Home() {
  const { session } = useAuth();
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-10">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold">Welcome to Action Central</h1>
            <p className="text-xl text-muted-foreground">
              Track, manage, and collaborate on action items with ease
            </p>
          </div>
          
          {!session ? (
            <Card className="mt-8">
              <CardContent className="pt-6 pb-6 flex flex-col items-center">
                <p className="mb-4 text-center">Sign in to access the full functionality of the application.</p>
                <Button size="lg" onClick={() => navigate('/auth')}>
                  Sign In
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 mt-8">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ListTodo className="h-5 w-5" />
                    My Actions
                  </CardTitle>
                  <CardDescription>View and manage actions assigned to you</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => navigate('/my-actions')}>
                    View My Actions
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    New Action
                  </CardTitle>
                  <CardDescription>Create a new action item</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => navigate('/add-action')}>
                    Create New Action
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Managed Actions
                  </CardTitle>
                  <CardDescription>Oversee all actions in the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => navigate('/managed-actions')}>
                    Manage Actions
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LayoutDashboard className="h-5 w-5" />
                    Dashboard
                  </CardTitle>
                  <CardDescription>View analytics and statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => navigate('/dashboard')}>
                    Go to Dashboard
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
      
      <footer className="py-6 border-t bg-muted/50">
        <div className="container text-center text-muted-foreground">
          <p>© 2025 Action Central. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
