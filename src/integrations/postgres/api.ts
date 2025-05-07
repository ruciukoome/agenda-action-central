
import axios from 'axios';
import { toast } from 'sonner';

// Base URL for API requests
const API_URL = 'http://localhost:5000/api';

// Create axios instance for API calls
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Test the PostgreSQL connection
export async function testConnection(credentials: {
  host: string;
  port: number | string;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
}) {
  try {
    // Ensure port is a number
    const formattedCredentials = {
      ...credentials,
      port: Number(credentials.port),
    };

    const response = await api.post('/db/test-connection', formattedCredentials);
    return response.data;
  } catch (error) {
    console.error('API error testing connection:', error);
    
    // Extract meaningful error message
    let errorMessage = 'Unknown error occurred';
    if (axios.isAxiosError(error)) {
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      message: `Connection failed: ${errorMessage}`,
      diagnostics: {
        errorMessage,
        host: credentials.host,
        port: credentials.port,
        database: credentials.database,
        user: credentials.user,
      }
    };
  }
}

// Initialize database with provided credentials
export async function initializeDatabase(credentials: {
  host: string;
  port: number | string;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
}) {
  try {
    // Ensure port is a number
    const formattedCredentials = {
      ...credentials,
      port: Number(credentials.port),
    };

    const response = await api.post('/db/initialize', formattedCredentials);
    return response.data;
  } catch (error) {
    console.error('API error initializing database:', error);
    let errorMessage = 'Unknown error occurred';
    
    if (axios.isAxiosError(error)) {
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    toast.error('Failed to initialize database', {
      description: errorMessage
    });
    
    throw new Error(`Database initialization failed: ${errorMessage}`);
  }
}

// Setup database schema
export async function setupDatabaseSchema() {
  try {
    const response = await api.post('/db/setup-schema');
    return response.data;
  } catch (error) {
    console.error('API error setting up schema:', error);
    let errorMessage = 'Unknown error occurred';
    
    if (axios.isAxiosError(error)) {
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    toast.error('Failed to set up database schema', {
      description: errorMessage
    });
    
    throw new Error(`Schema setup failed: ${errorMessage}`);
  }
}
