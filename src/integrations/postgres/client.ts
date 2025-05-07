
import { Pool } from 'pg';

/**
 * DATABASE CONFIGURATION
 * ---------------------
 * This file configures the connection to the PostgreSQL database.
 * 
 * Connection is established using environment variables:
 * - POSTGRES_HOST: The PostgreSQL host URL
 * - POSTGRES_PORT: The PostgreSQL port
 * - POSTGRES_DATABASE: The PostgreSQL database name
 * - POSTGRES_USER: The PostgreSQL username
 * - POSTGRES_PASSWORD: The PostgreSQL password
 * 
 * For development, these can be set in the Supabase Edge Function secrets.
 */

const POSTGRES_HOST = process.env.POSTGRES_HOST || 'localhost';
const POSTGRES_PORT = parseInt(process.env.POSTGRES_PORT || '5432');
const POSTGRES_DATABASE = process.env.POSTGRES_DATABASE || 'postgres';
const POSTGRES_USER = process.env.POSTGRES_USER || 'postgres';
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || '';

// Create a connection pool
const pool = new Pool({
  host: POSTGRES_HOST,
  port: POSTGRES_PORT,
  database: POSTGRES_DATABASE,
  user: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  ssl: process.env.NODE_ENV === 'production'
});

// Log connection status
console.log(`PostgreSQL client initialized, connecting to: ${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DATABASE}`);

/**
 * Execute a SQL query with optional parameters
 */
export async function executeQuery<T>(text: string, params: any[] = []): Promise<T[]> {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res.rows as T[];
  } catch (error) {
    console.error('Error executing query', { text, error });
    throw error;
  }
}

/**
 * Close the database connection pool
 * Call this when shutting down the application to release connections
 */
export async function closePool(): Promise<void> {
  await pool.end();
  console.log('Database connection pool closed');
}
