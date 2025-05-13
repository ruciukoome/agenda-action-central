
import { toast } from 'sonner';
import { initializeConnection } from '@/integrations/postgres/client';
import axios from 'axios';

/**
 * Utility to check if the PostgreSQL server is running and 
 * attempts to reconnect if necessary
 */
export async function checkPostgresConnection(): Promise<boolean> {
  try {
    // Check if server is running
    const healthResponse = await axios.get('http://localhost:5000/api/health', { 
      timeout: 3000 
    });
    
    if (healthResponse.status === 200) {
      console.log('PostgreSQL server is running:', healthResponse.data);
      
      // Try to initialize connection
      const initResult = await initializeConnection();
      
      if (initResult) {
        toast.success('PostgreSQL Connection Restored', {
          description: 'Successfully reconnected to the PostgreSQL database',
          duration: 3000
        });
        return true;
      } else {
        toast.error('Connection Initialization Failed', {
          description: 'Server is running but connection initialization failed',
          duration: 3000
        });
        return false;
      }
    }
    
    return false;
  } catch (error) {
    console.error('PostgreSQL server connection check failed:', error);
    
    toast.error('PostgreSQL Server Not Running', {
      description: 'Please start the server with "node server/index.js"',
      duration: 5000
    });
    
    return false;
  }
}

/**
 * Force reconnection to PostgreSQL server
 */
export async function reconnectToPostgres(): Promise<boolean> {
  toast.loading('Reconnecting to PostgreSQL...', {
    id: 'postgres-reconnect',
    duration: 3000
  });
  
  const result = await checkPostgresConnection();
  
  toast.dismiss('postgres-reconnect');
  
  return result;
}
