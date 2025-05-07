
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import { Loader2, Database, CheckCircle } from "lucide-react";
import { MigrationButton } from "@/utils/migrateData";
import { SchemaSetupButton } from "@/utils/runDatabaseSchema";
import { PostgresConnectionTest } from "@/components/PostgresConnectionTest";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

export default function DatabaseSetup() {
  const navigate = useNavigate();
  const [host, setHost] = useState(localStorage.getItem("POSTGRES_HOST") || "localhost");
  const [port, setPort] = useState(localStorage.getItem("POSTGRES_PORT") || "5432");
  const [database, setDatabase] = useState(localStorage.getItem("POSTGRES_DATABASE") || "postgres");
  const [username, setUsername] = useState(localStorage.getItem("POSTGRES_USER") || "postgres");
  const [password, setPassword] = useState(localStorage.getItem("POSTGRES_PASSWORD") || "");
  const [isLoading, setIsLoading] = useState(false);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  
  const handleSaveConfig = async () => {
    setIsLoading(true);
    
    try {
      // In a production environment, you would save these credentials securely
      // For this example, we'll just log them and show a success message
      console.log("Database connection settings:", {
        host,
        port,
        database,
        username,
        // Password not logged for security reasons
      });
      
      // Store in localStorage
      localStorage.setItem("POSTGRES_HOST", host);
      localStorage.setItem("POSTGRES_PORT", port);
      localStorage.setItem("POSTGRES_DATABASE", database);
      localStorage.setItem("POSTGRES_USER", username);
      // Storing password in localStorage is NOT recommended for production
      // This is just for demonstration purposes
      localStorage.setItem("POSTGRES_PASSWORD", password);
      
      toast.success("Connection settings saved", {
        description: "Database connection settings have been saved successfully.",
      });
      
      // Show connection test dialog
      setShowConnectionDialog(true);
    } catch (error) {
      toast.error("Failed to save settings", {
        description: `An error occurred: ${(error as Error).message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="container py-10">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Database Setup</h1>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>PostgreSQL Connection Settings</CardTitle>
              <CardDescription>
                Configure your PostgreSQL database connection settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="host">Host</Label>
                <Input
                  id="host"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="e.g., localhost or database.example.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  placeholder="5432"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="database">Database Name</Label>
                <Input
                  id="database"
                  value={database}
                  onChange={(e) => setDatabase(e.target.value)}
                  placeholder="postgres"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="postgres"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              
              <Button 
                className="w-full" 
                onClick={handleSaveConfig}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : "Save Connection Settings"}
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Connection Test</CardTitle>
              <CardDescription>
                Test your PostgreSQL connection with the saved settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PostgresConnectionTest />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Database Setup</CardTitle>
              <CardDescription>
                Set up your PostgreSQL database schema and migrate your data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">
                  First, set up the database schema (tables, types, indexes)
                </p>
                <SchemaSetupButton />
              </div>
              
              <div className="pt-2 border-t">
                <p className="mb-4 text-sm text-muted-foreground">
                  Then, migrate your existing data from Supabase to PostgreSQL
                </p>
                <MigrationButton />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Dialog open={showConnectionDialog} onOpenChange={setShowConnectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connection Settings Saved</DialogTitle>
            <DialogDescription>
              Your PostgreSQL connection settings have been saved. You can now:
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Test your connection
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Set up the database schema
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Migrate your existing data
              </li>
            </ul>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                The credentials shown in your screenshot indicate you're using a local PostgreSQL server.
                You can use these settings if you have PostgreSQL installed locally.
              </p>
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => setShowConnectionDialog(false)}
          >
            OK, I Understand
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
