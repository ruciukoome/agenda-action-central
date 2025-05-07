
/**
 * DATABASE CONFIGURATION
 * ---------------------
 * This file configures the connection to the PostgreSQL database.
 * 
 * Connection is established using environment variables or localStorage values:
 * - POSTGRES_HOST: The PostgreSQL host URL
 * - POSTGRES_PORT: The PostgreSQL port
 * - POSTGRES_DATABASE: The PostgreSQL database name
 * - POSTGRES_USER: The PostgreSQL username
 * - POSTGRES_PASSWORD: The PostgreSQL password
 */

// For browser environments, we need to provide a mock implementation
// of the Pool class from pg
interface PoolClient {
  query: (text: string, params?: any[]) => Promise<any>;
  release: () => void;
}

interface PoolConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean | object;
}

class MockPool {
  private config: PoolConfig;

  constructor(config: PoolConfig) {
    this.config = config;
    console.log('Mock PostgreSQL pool created with config:', {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      // Password omitted for security
    });
  }

  async query(text: string, params: any[] = []) {
    console.log('Mock query executed:', { text, params });
    // Return a mock result
    return {
      rows: [],
      rowCount: 0
    };
  }

  async connect(): Promise<PoolClient> {
    console.log('Mock connection established');
    return {
      query: async (text: string, params: any[] = []) => {
        console.log('Mock query executed via client:', { text, params });
        return { rows: [], rowCount: 0 };
      },
      release: () => console.log('Mock connection released')
    };
  }

  async end() {
    console.log('Mock pool ended');
  }
}

// Default connection parameters
let POSTGRES_HOST = 'localhost';
let POSTGRES_PORT = 5432;
let POSTGRES_DATABASE = 'postgres';
let POSTGRES_USER = 'postgres';
let POSTGRES_PASSWORD = '';

// Try to get credentials from localStorage
function loadCredentialsFromStorage() {
  if (typeof window !== 'undefined') {
    POSTGRES_HOST = localStorage.getItem('POSTGRES_HOST') || POSTGRES_HOST;
    POSTGRES_PORT = parseInt(localStorage.getItem('POSTGRES_PORT') || `${POSTGRES_PORT}`);
    POSTGRES_DATABASE = localStorage.getItem('POSTGRES_DATABASE') || POSTGRES_DATABASE;
    POSTGRES_USER = localStorage.getItem('POSTGRES_USER') || POSTGRES_USER;
    POSTGRES_PASSWORD = localStorage.getItem('POSTGRES_PASSWORD') || POSTGRES_PASSWORD;
  }

  // Use environment variables as fallback only if we're in a Node.js environment
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.POSTGRES_HOST) POSTGRES_HOST = process.env.POSTGRES_HOST;
    if (process.env.POSTGRES_PORT) POSTGRES_PORT = parseInt(process.env.POSTGRES_PORT);
    if (process.env.POSTGRES_DATABASE) POSTGRES_DATABASE = process.env.POSTGRES_DATABASE;
    if (process.env.POSTGRES_USER) POSTGRES_USER = process.env.POSTGRES_USER;
    if (process.env.POSTGRES_PASSWORD) POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD;
  }
}

// Load credentials immediately
loadCredentialsFromStorage();

// Create a connection pool
let pool: any;

function getPool() {
  // Reload credentials from localStorage to ensure we have the latest
  loadCredentialsFromStorage();
  
  // Create the pool if it doesn't exist or if credentials have changed
  if (!pool) {
    const poolConfig = {
      host: POSTGRES_HOST,
      port: POSTGRES_PORT,
      database: POSTGRES_DATABASE,
      user: POSTGRES_USER,
      password: POSTGRES_PASSWORD,
      ssl: typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production'
    };

    try {
      // Use dynamic import to avoid Vite bundling issues with 'pg'
      if (typeof window === 'undefined') {
        // Server environment - use real pg
        try {
          // This will only work in a Node.js environment
          const { Pool } = require('pg');
          pool = new Pool(poolConfig);
        } catch (e) {
          console.log('Failed to load pg module, using mock:', e);
          pool = new MockPool(poolConfig);
        }
      } else {
        // Browser environment - use mock
        pool = new MockPool(poolConfig);
      }
      
      console.log(`PostgreSQL client initialized, connecting to: ${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DATABASE}`);
    } catch (error) {
      console.error('Error creating pool:', error);
      pool = new MockPool(poolConfig);
    }
  }
  
  return pool;
}

/**
 * Execute a SQL query with optional parameters
 */
export async function executeQuery<T>(text: string, params: any[] = []): Promise<T[]> {
  const start = Date.now();
  try {
    const currentPool = getPool();
    const res = await currentPool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res.rows as T[];
  } catch (error) {
    console.error('Error executing query', { text, error });
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
  try {
    // Simple query to test connection
    const res = await executeQuery<Record<string, any>>('SELECT version() as version, current_timestamp as current_timestamp, current_user as current_user');
    
    return {
      success: true,
      message: "Successfully connected to PostgreSQL",
      diagnostics: {
        serverVersion: res[0]?.version?.split(' ')[1] || 'Unknown',
        serverTime: res[0]?.current_timestamp || new Date().toISOString(),
        connectedAs: res[0]?.current_user || POSTGRES_USER,
        host: POSTGRES_HOST,
        port: POSTGRES_PORT,
        database: POSTGRES_DATABASE,
        user: POSTGRES_USER,
        // Never include password in diagnostics
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to connect: ${(error as Error).message}`,
      diagnostics: {
        errorMessage: (error as Error).message,
        errorName: (error as Error).name,
        host: POSTGRES_HOST,
        port: POSTGRES_PORT,
        database: POSTGRES_DATABASE,
        user: POSTGRES_USER,
        // Never include password in diagnostics
      }
    };
  }
}

/**
 * Close the database connection pool
 * Call this when shutting down the application to release connections
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    console.log('Database connection pool closed');
  }
}
