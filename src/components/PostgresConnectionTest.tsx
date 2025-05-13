
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Database, RefreshCw, Save, ServerOff } from 'lucide-react';
import { testConnection, isApiServerRunning } from '@/integrations/postgres/api';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function PostgresConnectionTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [serverRunning, setServerRunning] = useState<boolean | null>(null);
  
  // Connection parameters with default values updated to match user's database
  const [host, setHost] = useState(() => localStorage.getItem('POSTGRES_HOST') || 'localhost');
  const [port, setPort] = useState(() => localStorage.getItem('POSTGRES_PORT') || '5432');
  const [database, setDatabase] = useState(() => localStorage.getItem('POSTGRES_DATABASE') || 'actionpoint');
  const [username, setUsername] = useState(() => localStorage.getItem('POSTGRES_USER') || 'postgres');
  const [password, setPassword] = useState(() => localStorage.getItem('POSTGRES_PASSWORD') || 'Qwerty&00Asdfgh');
  const [isConfigChanged, setIsConfigChanged] = useState(false);

  // Check if the API server is running on component mount
  useEffect(() => {
    const checkServer = async () => {
      const running = await isApiServerRunning();
      setServerRunning(running);
      
      if (!running) {
        setError("API server is not running. Make sure the backend server is started.");
        toast.error("Backend server not running", {
          description: "The Node.js server is not accessible. Run 'node server/index.js' to start it."
        });
      }
    };
    
    checkServer();
  }, []);

  const saveConnectionSettings = () => {
    try {
      // Save to localStorage
      localStorage.setItem('POSTGRES_HOST', host);
      localStorage.setItem('POSTGRES_PORT', port);
      localStorage.setItem('POSTGRES_DATABASE', database);
      localStorage.setItem('POSTGRES_USER', username);
      localStorage.setItem('POSTGRES_PASSWORD', password);
      
      // Reset the changed flag
      setIsConfigChanged(false);
      
      toast.success("Connection settings saved", {
        description: "Your PostgreSQL connection settings have been saved"
      });
    } catch (err) {
      console.error("Error saving connection settings:", err);
      toast.error("Failed to save settings", {
        description: (err as Error).message
      });
    }
  };

  const runConnectionTest = async () => {
    // If config has changed but not saved, prompt the user
    if (isConfigChanged) {
      if (!confirm("You have unsaved connection settings. Save them before testing?")) {
        return;
      }
      saveConnectionSettings();
    }
    
    // First check if the server is running
    const running = await isApiServerRunning();
    setServerRunning(running);
    
    if (!running) {
      setError("API server is not running. Make sure the backend server is started.");
      toast.error("Backend server not running", {
        description: "The Node.js server is not accessible. Run 'node server/index.js' to start it."
      });
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const diagnostics = await testConnection({
        host,
        port: Number(port),
        database,
        user: username,
        password
      });
      
      console.log("Connection test result:", diagnostics);
      setResult(diagnostics);
      
      if (diagnostics.success) {
        toast.success("Connection successful", {
          description: `Connected to PostgreSQL ${diagnostics.diagnostics.serverVersion || 'Unknown'}`
        });
      } else {
        toast.error("Connection failed", {
          description: diagnostics.message || "Unknown error occurred"
        });
      }
    } catch (err) {
      console.error("Connection test error:", err);
      setError((err as Error).message);
      setResult(null);
      toast.error("Connection failed", {
        description: (err as Error).message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = () => {
    setIsConfigChanged(true);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" /> PostgreSQL Connection Setup
        </CardTitle>
        <CardDescription>
          Configure and test your PostgreSQL connection parameters
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {serverRunning === false && (
          <Alert variant="destructive" className="mb-4">
            <ServerOff className="h-4 w-4" />
            <AlertTitle>Server Not Running</AlertTitle>
            <AlertDescription>
              The backend server is not running. Start it by running:<br />
              <code className="bg-muted p-1 rounded text-sm">node server/index.js</code><br />
              in your project directory.
            </AlertDescription>
          </Alert>
        )}
      
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="host">Host</Label>
            <Input 
              id="host" 
              value={host} 
              onChange={(e) => { setHost(e.target.value); handleInputChange(); }} 
              placeholder="localhost" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="port">Port</Label>
            <Input 
              id="port" 
              value={port} 
              onChange={(e) => { setPort(e.target.value); handleInputChange(); }} 
              placeholder="5432" 
              type="number"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="database">Database Name</Label>
          <Input 
            id="database" 
            value={database} 
            onChange={(e) => { setDatabase(e.target.value); handleInputChange(); }} 
            placeholder="actionpoint"
          />
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input 
              id="username" 
              value={username} 
              onChange={(e) => { setUsername(e.target.value); handleInputChange(); }} 
              placeholder="postgres"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              value={password} 
              onChange={(e) => { setPassword(e.target.value); handleInputChange(); }}
              placeholder="••••••••"
            />
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {result && (
          <div className="space-y-4 mt-4">
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                {result.success ? 'Connection Successful' : 'Connection Failed'}
              </AlertTitle>
              <AlertDescription>
                {result.success 
                  ? `Successfully connected to PostgreSQL server v${result.diagnostics.serverVersion || 'Unknown'}`
                  : result.diagnostics?.friendlyMessage || 'Failed to connect to PostgreSQL server. See details below.'}
              </AlertDescription>
            </Alert>
            
            <div className="rounded-md bg-slate-50 p-4">
              <pre className="text-xs overflow-auto max-h-60">
                {JSON.stringify(result.diagnostics, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-2">
        <Button 
          variant="outline"
          onClick={saveConnectionSettings} 
          disabled={isLoading || !isConfigChanged} 
          className="w-full sm:w-auto"
        >
          <Save className="mr-2 h-4 w-4" /> Save Settings
        </Button>
        <Button 
          onClick={runConnectionTest} 
          disabled={isLoading || serverRunning === false} 
          className="w-full sm:w-auto"
        >
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Testing Connection...
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" /> Test PostgreSQL Connection
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
