
import mysql from 'mysql2/promise';

/**
 * DATABASE CONFIGURATION - MySQL Version
 * ---------------------
 * This file configures the connection to a MySQL database.
 */

// Create connection pool
// These environment variables would need to be set in your deployment environment
export const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'action_central',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// For use in application code
export const executeQuery = async <T>(query: string, params: any[] = []): Promise<T[]> => {
  try {
    const [rows] = await pool.execute(query, params);
    return rows as T[];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    await pool.query('SELECT 1');
    console.log('MySQL connection successful');
    return true;
  } catch (error) {
    console.error('MySQL connection failed:', error);
    return false;
  }
};
