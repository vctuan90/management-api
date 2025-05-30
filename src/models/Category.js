const { runQuery, getOne, getAll } = require('../database/database');

class Category {
  /**
   * Create a new category
   * @param {Object} categoryData - Category data
   * @returns {Promise<Object>} Created category
   */
  static async create(categoryData) {
    const { name, description, slug } = categoryData;
    
    // Generate slug if not provided
    const finalSlug = slug || this.generateSlug(name);
    
    const sql = `
      INSERT INTO categories (name, description, slug)
      VALUES (?, ?, ?)
    `;
    
    const result = await runQuery(sql, [name, description, finalSlug]);
    return await this.findById(result.id);
  }

  /**
   * Find category by ID
   * @param {number} id - Category ID
   * @returns {Promise<Object|null>} Category object or null
   */
  static async findById(id) {
    const sql = `
      SELECT id, name, description, slug, is_active, created_at, updated_at
      FROM categories
      WHERE id = ?
    `;
    
    return await getOne(sql, [id]);
  }

  /**
   * Find category by slug
   * @param {string} slug - Category slug
   * @returns {Promise<Object|null>} Category object or null
   */
  static async findBySlug(slug) {
    const sql = `
      SELECT id, name, description, slug, is_active, created_at, updated_at
      FROM categories
      WHERE slug = ?
    `;
    
    return await getOne(sql, [slug]);
  }

  /**
   * Get all categories with pagination and filtering
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Categories list with pagination info
   */
  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'desc',
      is_active,
      search
    } = options;

    const offset = (page - 1) * limit;
    const validSortFields = ['id', 'name', 'slug', 'created_at'];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Build WHERE clause
    let whereConditions = [];
    let params = [];

    if (typeof is_active === 'boolean') {
      whereConditions.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }

    if (search) {
      whereConditions.push('(name LIKE ? OR description LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM categories ${whereClause}`;
    const countResult = await getOne(countSql, params);
    const total = countResult.total;

    // Get categories with news count
    const sql = `
      SELECT 
        c.id, 
        c.name, 
        c.description, 
        c.slug, 
        c.is_active, 
        c.created_at, 
        c.updated_at,
        COUNT(n.id) as news_count
      FROM categories c
      LEFT JOIN news n ON c.id = n.category_id
      ${whereClause}
      GROUP BY c.id, c.name, c.description, c.slug, c.is_active, c.created_at, c.updated_at
      ORDER BY ${sortField} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const categories = await getAll(sql, [...params, limit, offset]);

    return {
      categories,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update category by ID
   * @param {number} id - Category ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated category or null
   */
  static async updateById(id, updateData) {
    const allowedFields = ['name', 'description', 'slug', 'is_active'];
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
      UPDATE categories
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    await runQuery(sql, params);
    return await this.findById(id);
  }

  /**
   * Delete category by ID
   * @param {number} id - Category ID
   * @returns {Promise<boolean>} Success status
   */
  static async deleteById(id) {
    const sql = 'DELETE FROM categories WHERE id = ?';
    const result = await runQuery(sql, [id]);
    return result.changes > 0;
  }

  /**
   * Check if category exists by name or slug
   * @param {string} name - Category name
   * @param {string} slug - Category slug
   * @param {number} excludeId - ID to exclude from check (for updates)
   * @returns {Promise<Object>} Existence check result
   */
  static async checkExists(name, slug, excludeId = null) {
    let sql = 'SELECT id, name, slug FROM categories WHERE (name = ? OR slug = ?)';
    let params = [name, slug];

    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }

    const existingCategory = await getOne(sql, params);
    
    if (existingCategory) {
      return {
        exists: true,
        field: existingCategory.name === name ? 'name' : 'slug'
      };
    }

    return { exists: false };
  }

  /**
   * Get category with news count
   * @param {number} id - Category ID
   * @returns {Promise<Object|null>} Category with news count
   */
  static async findByIdWithNewsCount(id) {
    const sql = `
      SELECT 
        c.id, 
        c.name, 
        c.description, 
        c.slug, 
        c.is_active, 
        c.created_at, 
        c.updated_at,
        COUNT(n.id) as news_count
      FROM categories c
      LEFT JOIN news n ON c.id = n.category_id
      WHERE c.id = ?
      GROUP BY c.id, c.name, c.description, c.slug, c.is_active, c.created_at, c.updated_at
    `;
    
    return await getOne(sql, [id]);
  }

  /**
   * Generate slug from text
   * @param {string} text - Text to convert to slug
   * @returns {string} Generated slug
   */
  static generateSlug(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Get active categories only
   * @returns {Promise<Array>} List of active categories
   */
  static async findActive() {
    const sql = `
      SELECT id, name, description, slug, created_at, updated_at
      FROM categories
      WHERE is_active = 1
      ORDER BY name ASC
    `;
    
    return await getAll(sql);
  }
}

module.exports = Category; 