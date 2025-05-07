
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface DatabaseEnvironmentWarningProps {
  showFullMessage?: boolean;
}

export function DatabaseEnvironmentWarning({ showFullMessage = false }: DatabaseEnvironmentWarningProps) {
  if (typeof window === 'undefined') {
    // We're in a server environment, no need for warning
    return null;
  }
  
  return (
    <Alert variant="warning" className="mb-6">
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle>Browser Environment Detected</AlertTitle>
      <AlertDescription>
        {showFullMessage ? (
          <>
            <p>
              PostgreSQL operations cannot execute directly in a browser environment. 
              The application is currently running with mock functionality.
            </p>
            <p className="mt-2">
              To use real PostgreSQL functionality, you would need to:
            </p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Run the application in a Node.js environment</li>
              <li>Create a server API that handles database operations</li>
              <li>Configure CORS to allow browser requests to your API</li>
            </ul>
          </>
        ) : (
          "PostgreSQL operations are mocked in browser environments."
        )}
      </AlertDescription>
    </Alert>
  );
}
