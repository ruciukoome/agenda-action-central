
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Database, RefreshCw } from 'lucide-react';
import { testConnection } from '@/integrations/mysql/client';

export function MySQLConnectionTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runConnectionTest = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const diagnostics = await testConnection();
      setResult(diagnostics);
    } catch (err) {
      setError((err as Error).message);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" /> MySQL Connection Test
        </CardTitle>
        <CardDescription>
          Test your MySQL connection and view diagnostic information
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
                  ? `Successfully connected to MySQL server v${result.diagnostics.serverVersion}`
                  : 'Failed to connect to MySQL server. See details below.'}
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
            'Test MySQL Connection'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
