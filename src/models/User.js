const bcrypt = require('bcryptjs');
const { runQuery, getOne, getAll } = require('../database/database');

class User {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  static async create(userData) {
    const { username, email, password, first_name, last_name, role = 'user' } = userData;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const sql = `
      INSERT INTO users (username, email, password, first_name, last_name, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const result = await runQuery(sql, [username, email, hashedPassword, first_name, last_name, role]);
    
    // Return user without password
    return await this.findById(result.id);
  }

  /**
   * Find user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} User object or null
   */
  static async findById(id) {
    const sql = `
      SELECT id, username, email, first_name, last_name, role, is_active, created_at, updated_at
      FROM users
      WHERE id = ?
    `;
    
    return await getOne(sql, [id]);
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User object or null
   */
  static async findByEmail(email) {
    const sql = `
      SELECT id, username, email, password, first_name, last_name, role, is_active, created_at, updated_at
      FROM users
      WHERE email = ?
    `;
    
    return await getOne(sql, [email]);
  }

  /**
   * Find user by username
   * @param {string} username - Username
   * @returns {Promise<Object|null>} User object or null
   */
  static async findByUsername(username) {
    const sql = `
      SELECT id, username, email, first_name, last_name, role, is_active, created_at, updated_at
      FROM users
      WHERE username = ?
    `;
    
    return await getOne(sql, [username]);
  }

  /**
   * Get all users with pagination and filtering
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Users list with pagination info
   */
  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'desc',
      role,
      is_active,
      search
    } = options;

    const offset = (page - 1) * limit;
    const validSortFields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'created_at'];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Build WHERE clause
    let whereConditions = [];
    let params = [];

    if (role) {
      whereConditions.push('role = ?');
      params.push(role);
    }

    if (typeof is_active === 'boolean') {
      whereConditions.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }

    if (search) {
      whereConditions.push('(username LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const countResult = await getOne(countSql, params);
    const total = countResult.total;

    // Get users
    const sql = `
      SELECT id, username, email, first_name, last_name, role, is_active, created_at, updated_at
      FROM users
      ${whereClause}
      ORDER BY ${sortField} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const users = await getAll(sql, [...params, limit, offset]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update user by ID
   * @param {number} id - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated user or null
   */
  static async updateById(id, updateData) {
    const allowedFields = ['username', 'email', 'first_name', 'last_name', 'role', 'is_active'];
    const updateFields = [];
    const params = [];

    // Build UPDATE clause
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        params.push(updateData[key]);
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    // Add updated_at timestamp
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const sql = `
      UPDATE users
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    await runQuery(sql, params);
    return await this.findById(id);
  }

  /**
   * Change user password
   * @param {number} id - User ID
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success status
   */
  static async changePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    const sql = `
      UPDATE users
      SET password = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const result = await runQuery(sql, [hashedPassword, id]);
    return result.changes > 0;
  }

  /**
   * Delete user by ID
   * @param {number} id - User ID
   * @returns {Promise<boolean>} Success status
   */
  static async deleteById(id) {
    const sql = 'DELETE FROM users WHERE id = ?';
    const result = await runQuery(sql, [id]);
    return result.changes > 0;
  }

  /**
   * Verify user password
   * @param {string} password - Plain text password
   * @param {string} hashedPassword - Hashed password from database
   * @returns {Promise<boolean>} Password match status
   */
  static async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * Check if user exists by email or username
   * @param {string} email - Email
   * @param {string} username - Username
   * @param {number} excludeId - ID to exclude from check (for updates)
   * @returns {Promise<Object>} Existence check result
   */
  static async checkExists(email, username, excludeId = null) {
    let sql = 'SELECT id, email, username FROM users WHERE (email = ? OR username = ?)';
    let params = [email, username];

    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }

    const existingUser = await getOne(sql, params);
    
    if (existingUser) {
      return {
        exists: true,
        field: existingUser.email === email ? 'email' : 'username'
      };
    }

    return { exists: false };
  }
}

module.exports = User; 