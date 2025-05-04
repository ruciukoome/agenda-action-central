
import mysql from 'mysql2/promise';

/**
 * DATABASE CONFIGURATION - MySQL Version
 * ---------------------
 * This file configures the connection to a MySQL database with enhanced logging.
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

// Enhanced logging function
const logQuery = (query: string, params: any[] = [], startTime: number, error?: any) => {
  const duration = Date.now() - startTime;
  if (error) {
    console.error(`[MySQL Error][${duration}ms] Query failed:`, {
      query,
      params: JSON.stringify(params),
      error: error.message,
      code: error.code,
      sqlState: error.sqlState
    });
  } else {
    console.log(`[MySQL][${duration}ms] Query executed:`, {
      query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
      paramCount: params.length
    });
  }
};

// For use in application code - with enhanced error handling and logging
export const executeQuery = async <T>(query: string, params: any[] = []): Promise<T[]> => {
  const startTime = Date.now();
  try {
    const [rows] = await pool.execute(query, params);
    logQuery(query, params, startTime);
    return rows as T[];
  } catch (error) {
    logQuery(query, params, startTime, error);
    console.error('Database query error details:', error);
    throw error;
  }
};

// Test database connection with detailed diagnostics
export const testConnection = async (): Promise<{success: boolean; diagnostics: any}> => {
  try {
    console.log('Testing MySQL connection...');
    const startTime = Date.now();
    
    // Basic connectivity test
    const [result] = await pool.query('SELECT 1 as connectionTest');
    const basicConnectTime = Date.now() - startTime;
    
    // Get server info
    const [serverInfo] = await pool.query('SELECT VERSION() as version');
    
    // Test a more complex query
    const tableCheckStart = Date.now();
    const [tables] = await pool.query("SHOW TABLES");
    const tableCheckTime = Date.now() - tableCheckStart;
    
    const diagnostics = {
      connectionEstablished: true,
      basicConnectTime: `${basicConnectTime}ms`,
      serverVersion: (serverInfo as any)[0].version,
      tablesFound: (tables as any[]).length,
      tableCheckTime: `${tableCheckTime}ms`,
      poolConfig: {
        connectionLimit: pool.config.connectionLimit,
        host: pool.config.host,
        user: pool.config.user,
        database: pool.config.database
      }
    };
    
    console.log('MySQL connection successful', diagnostics);
    return { success: true, diagnostics };
  } catch (error) {
    console.error('MySQL connection failed:', error);
    const diagnostics = {
      connectionEstablished: false,
      error: {
        message: (error as any).message,
        code: (error as any).code,
        errno: (error as any).errno,
        sqlState: (error as any).sqlState,
        sqlMessage: (error as any).sqlMessage
      },
      connectionDetails: {
        host: pool.config.host,
        user: pool.config.user,
        database: pool.config.database,
      }
    };
    return { success: false, diagnostics };
  }
};

