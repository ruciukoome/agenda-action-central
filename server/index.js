
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database connection pool
let pool = null;

// Function to initialize the database pool with provided credentials
function initializePool(credentials) {
  if (pool) {
    // Close existing pool if it exists
    pool.end().catch(err => console.error('Error closing pool:', err));
  }

  pool = new Pool({
    host: credentials.host,
    port: credentials.port,
    database: credentials.database,
    user: credentials.user,
    password: credentials.password,
    ssl: credentials.ssl ? { rejectUnauthorized: false } : false
  });

  // Test connection
  return pool.query('SELECT NOW()')
    .then(() => {
      console.log('Successfully connected to PostgreSQL database');
      return true;
    })
    .catch(err => {
      console.error('Error connecting to PostgreSQL:', err);
      return false;
    });
}

// API Routes

// Test connection route
app.post('/api/db/test-connection', async (req, res) => {
  try {
    const credentials = req.body;
    
    // Validate required fields
    if (!credentials.host || !credentials.port || !credentials.database || !credentials.user) {
      return res.status(400).json({
        success: false,
        message: 'Missing required database credentials',
        diagnostics: { error: 'Invalid credentials provided' }
      });
    }

    const testPool = new Pool({
      host: credentials.host,
      port: credentials.port,
      database: credentials.database,
      user: credentials.user,
      password: credentials.password,
      ssl: credentials.ssl ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 5000 // 5 seconds timeout
    });

    // Test the connection
    const result = await testPool.query('SELECT version() as version, current_timestamp, current_user');
    await testPool.end();

    return res.json({
      success: true,
      message: 'Successfully connected to PostgreSQL',
      diagnostics: {
        serverVersion: result.rows[0].version.split(' ')[1] || 'Unknown',
        serverTime: result.rows[0].current_timestamp,
        connectedAs: result.rows[0].current_user,
        host: credentials.host,
        port: credentials.port,
        database: credentials.database,
        user: credentials.user
      }
    });
  } catch (error) {
    console.error('Connection test error:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to connect: ${error.message}`,
      diagnostics: {
        errorMessage: error.message,
        errorName: error.name,
        host: req.body.host,
        port: req.body.port,
        database: req.body.database,
        user: req.body.user
      }
    });
  }
});

// Initialize database with credentials
app.post('/api/db/initialize', async (req, res) => {
  try {
    const success = await initializePool(req.body);
    if (success) {
      return res.json({ success: true, message: 'Database connection initialized' });
    } else {
      return res.status(500).json({ success: false, message: 'Failed to initialize database connection' });
    }
  } catch (error) {
    console.error('DB initialization error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error initializing database connection',
      error: error.message
    });
  }
});

// Run database schema setup
app.post('/api/db/setup-schema', async (req, res) => {
  try {
    if (!pool) {
      return res.status(400).json({ success: false, message: 'Database connection not initialized' });
    }

    // Read schema SQL from file
    const fs = require('fs');
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    
    // Execute schema SQL
    await pool.query(schemaSQL);
    
    return res.json({ success: true, message: 'Database schema setup completed successfully' });
  } catch (error) {
    console.error('Schema setup error:', error);
    return res.status(500).json({ success: false, message: `Schema setup failed: ${error.message}` });
  }
});

// Actions API endpoints
app.get('/api/actions', async (req, res) => {
  try {
    if (!pool) {
      return res.status(400).json({ success: false, message: 'Database connection not initialized' });
    }
    
    const userId = req.query.userId || 'test-user-id';
    
    const query = `
      SELECT * FROM actions 
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    return res.json(result.rows);
  } catch (error) {
    console.error('Error fetching actions:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/actions', async (req, res) => {
  try {
    if (!pool) {
      return res.status(400).json({ success: false, message: 'Database connection not initialized' });
    }
    
    const { action, userId } = req.body;
    
    if (!action || !userId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    const { v4: uuidv4 } = require('uuid');
    const actionId = uuidv4();
    const now = new Date().toISOString();
    
    const query = `
      INSERT INTO actions (
        id, description, department, meeting_date, priority, owner_email,
        completed, progress_status, notes, created_at, updated_at, due_date, user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    
    const values = [
      actionId,
      action.description,
      action.department,
      action.meetingDate,
      action.priority,
      action.ownerEmail,
      action.completed || false,
      action.progressStatus || 'Not Started',
      action.notes || '',
      now,
      now,
      action.dueDate || null,
      userId
    ];
    
    const result = await pool.query(query, values);
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating action:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/actions/:id', async (req, res) => {
  try {
    if (!pool) {
      return res.status(400).json({ success: false, message: 'Database connection not initialized' });
    }
    
    const actionId = req.params.id;
    const { action, userId } = req.body;
    
    if (!action || !userId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCounter = 1;
    
    // Add fields that might be updated
    const fieldsMap = {
      description: 'description',
      department: 'department',
      meetingDate: 'meeting_date',
      priority: 'priority',
      ownerEmail: 'owner_email',
      completed: 'completed',
      progressStatus: 'progress_status',
      notes: 'notes',
      dueDate: 'due_date'
    };
    
    Object.entries(fieldsMap).forEach(([jsField, dbField]) => {
      if (action[jsField] !== undefined) {
        updateFields.push(`${dbField} = $${paramCounter++}`);
        values.push(action[jsField]);
      }
    });
    
    // Always update updated_at timestamp
    updateFields.push(`updated_at = $${paramCounter++}`);
    values.push(new Date().toISOString());
    
    // Add id and userId to values
    values.push(actionId);
    values.push(userId);
    
    const query = `
      UPDATE actions 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramCounter++} AND user_id = $${paramCounter++}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Action not found or you do not have permission to update it' 
      });
    }
    
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating action:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/actions/:id', async (req, res) => {
  try {
    if (!pool) {
      return res.status(400).json({ success: false, message: 'Database connection not initialized' });
    }
    
    const actionId = req.params.id;
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Missing required userId parameter' });
    }
    
    const query = `
      DELETE FROM actions 
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;
    
    const result = await pool.query(query, [actionId, userId]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Action not found or you do not have permission to delete it' 
      });
    }
    
    return res.json({ success: true, message: 'Action deleted successfully' });
  } catch (error) {
    console.error('Error deleting action:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
  });
}

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;
