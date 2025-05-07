
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Database, RefreshCw } from 'lucide-react';
import { testConnection } from '@/integrations/postgres/client';
import { toast } from 'sonner';

export function PostgresConnectionTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runConnectionTest = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const diagnostics = await testConnection();
      console.log("Connection test result:", diagnostics);
      setResult(diagnostics);
      
      if (diagnostics.success) {
        toast.success("Connection successful", {
          description: `Connected to PostgreSQL ${diagnostics.diagnostics.serverVersion || 'Unknown'}`
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" /> PostgreSQL Connection Test
        </CardTitle>
        <CardDescription>
          Test your PostgreSQL connection and view diagnostic information
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {result && (
          <div className="space-y-4">
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
                  : 'Failed to connect to PostgreSQL server. See details below.'}
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
      <CardFooter>
        <Button onClick={runConnectionTest} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Testing Connection...
            </>
          ) : (
            'Test PostgreSQL Connection'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
