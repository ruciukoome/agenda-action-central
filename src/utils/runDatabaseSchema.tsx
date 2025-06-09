
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Database } from 'lucide-react';
import { toast } from '@/lib/toast-wrapper';
import { setupDatabaseSchema } from '@/integrations/postgres/api';

export function SchemaSetupButton() {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSetupSchema = async () => {
    setIsLoading(true);
    
    try {
      const result = await setupDatabaseSchema();
      
      if (result.success) {
        toast.success('Database Schema Setup Complete', {
          description: 'The database schema was successfully created'
        });
      } else {
        toast.error('Schema Setup Failed', {
          description: result.message || 'An error occurred during schema setup'
        });
      }
    } catch (error) {
      console.error('Schema setup error:', error);
      toast.error('Schema Setup Failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Button 
      onClick={handleSetupSchema} 
      disabled={isLoading}
      className="w-full sm:w-auto"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Setting up schema...
        </>
      ) : (
        <>
          <Database className="mr-2 h-4 w-4" />
          Run Database Schema Setup
        </>
      )}
    </Button>
  );
}
