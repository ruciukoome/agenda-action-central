
/**
 * DATABASE CONFIGURATION
 * ---------------------
 * This file configures the connection to the PostgreSQL database via the backend API.
 * 
 * Connection is established using environment variables or localStorage values:
 * - POSTGRES_HOST: The PostgreSQL host URL
 * - POSTGRES_PORT: The PostgreSQL port
 * - POSTGRES_DATABASE: The PostgreSQL database name
 * - POSTGRES_USER: The PostgreSQL username
 * - POSTGRES_PASSWORD: The PostgreSQL password
 */

import axios from 'axios';
import { testConnection as apiTestConnection, initializeDatabase } from './api';

// Base URL for API requests
const API_URL = 'http://localhost:5000/api';

// Default connection parameters - these will be overridden by localStorage
let POSTGRES_HOST = 'localhost';
let POSTGRES_PORT = 5432;
let POSTGRES_DATABASE = 'actionpoint'; // Corrected database name
let POSTGRES_USER = 'postgres';
let POSTGRES_PASSWORD = 'Qwerty&00Asdfgh';

// Create axios instance for API calls
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Try to get credentials from localStorage
export function loadCredentialsFromStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    POSTGRES_HOST = localStorage.getItem('POSTGRES_HOST') || POSTGRES_HOST;
    POSTGRES_PORT = parseInt(localStorage.getItem('POSTGRES_PORT') || `${POSTGRES_PORT}`);
    POSTGRES_DATABASE = localStorage.getItem('POSTGRES_DATABASE') || POSTGRES_DATABASE;
    POSTGRES_USER = localStorage.getItem('POSTGRES_USER') || POSTGRES_USER;
    POSTGRES_PASSWORD = localStorage.getItem('POSTGRES_PASSWORD') || POSTGRES_PASSWORD;
    
    console.log('Loaded PostgreSQL credentials from localStorage', {
      host: POSTGRES_HOST,
      port: POSTGRES_PORT,
      database: POSTGRES_DATABASE,
      user: POSTGRES_USER,
      // Password omitted for security
    });
  }
}

// Load credentials immediately
loadCredentialsFromStorage();

/**
 * Execute a SQL query with optional parameters via the backend API
 */
export async function executeQuery<T>(text: string, params: any[] = []): Promise<T[]> {
  try {
    // Reload credentials to ensure we have the latest
    loadCredentialsFromStorage();
    
    // For security, we don't want to expose the raw SQL query to the frontend
    // Instead, we use the API endpoints that encapsulate the queries
    
    // This is a simplified approach for demo purposes
    // In a production app, you would have specific API endpoints for each operation
    
    if (text.toLowerCase().includes('select * from actions')) {
      const userId = params[0] || 'test-user-id';
      const response = await api.get('/actions', { params: { userId } });
      return response.data as T[];
    }
    
    console.warn('Unhandled query type:', text);
    return [] as T[];
  } catch (error) {
    console.error('Error executing query via API:', error);
    throw error;
  }
}

/**
 * Test the database connection
 * Returns basic diagnostics information
 */
export async function testConnection(): Promise<{ 
  success: boolean;
  message: string;
  diagnostics: Record<string, any>;
}> {
  // Reload credentials before testing
  loadCredentialsFromStorage();
  
  try {
    // Use the API to test the connection
    const result = await apiTestConnection({
      host: POSTGRES_HOST,
      port: POSTGRES_PORT,
      database: POSTGRES_DATABASE,
      user: POSTGRES_USER,
      password: POSTGRES_PASSWORD
    });
    
    return result;
  } catch (error) {
    console.error('Connection test error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      diagnostics: {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorName: error instanceof Error ? error.name : 'Error',
        host: POSTGRES_HOST,
        port: POSTGRES_PORT,
        database: POSTGRES_DATABASE,
        user: POSTGRES_USER
      }
    };
  }
}

/**
 * Initialize the database connection with current credentials
 */
export async function initializeConnection(): Promise<boolean> {
  try {
    // Reload credentials
    loadCredentialsFromStorage();
    
    // Initialize the database connection via API
    await initializeDatabase({
      host: POSTGRES_HOST,
      port: POSTGRES_PORT,
      database: POSTGRES_DATABASE,
      user: POSTGRES_USER,
      password: POSTGRES_PASSWORD
    });
    
    return true;
  } catch (error) {
    console.error('Error initializing database connection:', error);
    return false;
  }
}

/**
 * Close the database connection pool
 * In this API-based implementation, this is a no-op
 */
export async function closePool(): Promise<void> {
  // No actual pool to close in the frontend
  console.log('closePool called - no action needed in API-based implementation');
}
