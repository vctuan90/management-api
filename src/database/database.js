const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../utils/logger');

// Database connection
let db = null;

/**
 * Initialize database connection and create tables
 */
async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.sqlite');
    
    db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
      if (err) {
        logger.error('Error opening database:', err);
        reject(err);
      } else {
        logger.info('Connected to SQLite database');
        createTables()
          .then(() => resolve())
          .catch((error) => reject(error));
      }
    });
  });
}

/**
 * Create database tables
 */
async function createTables() {
  return new Promise((resolve, reject) => {
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON', (err) => {
      if (err) {
        logger.error('Error enabling foreign keys:', err);
        reject(err);
        return;
      }
    });

    // Users table
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Categories table
    const createCategoriesTable = `
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        slug VARCHAR(255) UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // News table
    const createNewsTable = `
      CREATE TABLE IF NOT EXISTS news (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        summary TEXT,
        slug VARCHAR(500) UNIQUE NOT NULL,
        featured_image VARCHAR(500),
        status VARCHAR(50) DEFAULT 'draft',
        category_id INTEGER,
        author_id INTEGER NOT NULL,
        published_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;

    const tables = [
      { name: 'users', sql: createUsersTable },
      { name: 'categories', sql: createCategoriesTable },
      { name: 'news', sql: createNewsTable }
    ];

    let completedTables = 0;
    const totalTables = tables.length;

    tables.forEach((table) => {
      db.run(table.sql, (err) => {
        if (err) {
          logger.error(`Error creating ${table.name} table:`, err);
          reject(err);
        } else {
          logger.info(`${table.name} table created or already exists`);
          completedTables++;
          
          if (completedTables === totalTables) {
            resolve();
          }
        }
      });
    });
  });
}

/**
 * Get database instance
 */
function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

/**
 * Close database connection
 */
function closeDatabase() {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          logger.error('Error closing database:', err);
          reject(err);
        } else {
          logger.info('Database connection closed');
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

/**
 * Run a query with parameters
 */
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ 
          id: this.lastID, 
          changes: this.changes 
        });
      }
    });
  });
}

/**
 * Get a single row
 */
function getOne(sql, params = []) {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

/**
 * Get multiple rows
 */
function getAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

module.exports = {
  initializeDatabase,
  getDatabase,
  closeDatabase,
  runQuery,
  getOne,
  getAll
}; 