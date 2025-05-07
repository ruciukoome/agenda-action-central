
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import { Loader2 } from "lucide-react";
import { MigrationButton } from "@/utils/migrateData";

export default function DatabaseSetup() {
  const { toast } = useToast();
  const [host, setHost] = useState("");
  const [port, setPort] = useState("5432");
  const [database, setDatabase] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
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
      
      // Normally we would save this to secure storage or environment variables
      localStorage.setItem("POSTGRES_HOST", host);
      localStorage.setItem("POSTGRES_PORT", port);
      localStorage.setItem("POSTGRES_DATABASE", database);
      localStorage.setItem("POSTGRES_USER", username);
      // Storing password in localStorage is NOT recommended for production
      // This is just for demonstration purposes
      localStorage.setItem("POSTGRES_PASSWORD", password);
      
      toast({
        title: "Connection settings saved",
        description: "Database connection settings have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Failed to save settings",
        description: `An error occurred: ${(error as Error).message}`,
        variant: "destructive",
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
              <CardTitle>Data Migration</CardTitle>
              <CardDescription>
                Transfer your existing data from Supabase to your PostgreSQL database.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                This will copy all your existing action items from Supabase to your configured PostgreSQL database. Make sure your database is set up correctly before proceeding.
              </p>
              <MigrationButton />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
