const { runQuery, getOne, getAll } = require('../database/database');

class News {
  /**
   * Create a new news article
   * @param {Object} newsData - News data
   * @returns {Promise<Object>} Created news article
   */
  static async create(newsData) {
    const { 
      title, 
      content, 
      summary, 
      slug, 
      featured_image, 
      status = 'draft', 
      category_id, 
      author_id 
    } = newsData;
    
    // Generate slug if not provided
    const finalSlug = slug || this.generateSlug(title);
    
    const sql = `
      INSERT INTO news (title, content, summary, slug, featured_image, status, category_id, author_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await runQuery(sql, [
      title, 
      content, 
      summary, 
      finalSlug, 
      featured_image, 
      status, 
      category_id, 
      author_id
    ]);
    
    return await this.findById(result.id);
  }

  /**
   * Find news by ID with author and category details
   * @param {number} id - News ID
   * @returns {Promise<Object|null>} News object or null
   */
  static async findById(id) {
    const sql = `
      SELECT 
        n.id,
        n.title,
        n.content,
        n.summary,
        n.slug,
        n.featured_image,
        n.status,
        n.published_at,
        n.created_at,
        n.updated_at,
        n.category_id,
        c.name as category_name,
        c.slug as category_slug,
        n.author_id,
        u.username as author_username,
        u.first_name as author_first_name,
        u.last_name as author_last_name
      FROM news n
      LEFT JOIN categories c ON n.category_id = c.id
      LEFT JOIN users u ON n.author_id = u.id
      WHERE n.id = ?
    `;
    
    return await getOne(sql, [id]);
  }

  /**
   * Find news by slug with author and category details
   * @param {string} slug - News slug
   * @returns {Promise<Object|null>} News object or null
   */
  static async findBySlug(slug) {
    const sql = `
      SELECT 
        n.id,
        n.title,
        n.content,
        n.summary,
        n.slug,
        n.featured_image,
        n.status,
        n.published_at,
        n.created_at,
        n.updated_at,
        n.category_id,
        c.name as category_name,
        c.slug as category_slug,
        n.author_id,
        u.username as author_username,
        u.first_name as author_first_name,
        u.last_name as author_last_name
      FROM news n
      LEFT JOIN categories c ON n.category_id = c.id
      LEFT JOIN users u ON n.author_id = u.id
      WHERE n.slug = ?
    `;
    
    return await getOne(sql, [slug]);
  }

  /**
   * Get all news with pagination and filtering
   * @param {Object} options - Query options
   * @returns {Promise<Object>} News list with pagination info
   */
  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'desc',
      status,
      category_id,
      author_id,
      search
    } = options;

    const offset = (page - 1) * limit;
    const validSortFields = ['id', 'title', 'status', 'published_at', 'created_at'];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Build WHERE clause
    let whereConditions = [];
    let params = [];

    if (status) {
      whereConditions.push('n.status = ?');
      params.push(status);
    }

    if (category_id) {
      whereConditions.push('n.category_id = ?');
      params.push(category_id);
    }

    if (author_id) {
      whereConditions.push('n.author_id = ?');
      params.push(author_id);
    }

    if (search) {
      whereConditions.push('(n.title LIKE ? OR n.content LIKE ? OR n.summary LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total 
      FROM news n
      LEFT JOIN categories c ON n.category_id = c.id
      LEFT JOIN users u ON n.author_id = u.id
      ${whereClause}
    `;
    const countResult = await getOne(countSql, params);
    const total = countResult.total;

    // Get news with relationships
    const sql = `
      SELECT 
        n.id,
        n.title,
        n.summary,
        n.slug,
        n.featured_image,
        n.status,
        n.published_at,
        n.created_at,
        n.updated_at,
        n.category_id,
        c.name as category_name,
        c.slug as category_slug,
        n.author_id,
        u.username as author_username,
        u.first_name as author_first_name,
        u.last_name as author_last_name
      FROM news n
      LEFT JOIN categories c ON n.category_id = c.id
      LEFT JOIN users u ON n.author_id = u.id
      ${whereClause}
      ORDER BY n.${sortField} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const news = await getAll(sql, [...params, limit, offset]);

    return {
      news,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update news by ID
   * @param {number} id - News ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated news or null
   */
  static async updateById(id, updateData) {
    const allowedFields = ['title', 'content', 'summary', 'slug', 'featured_image', 'status', 'category_id'];
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

    // Handle published_at timestamp for status changes
    if (updateData.status === 'published') {
      updateFields.push('published_at = CURRENT_TIMESTAMP');
    } else if (updateData.status && updateData.status !== 'published') {
      updateFields.push('published_at = NULL');
    }

    // Add updated_at timestamp
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const sql = `
      UPDATE news
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    await runQuery(sql, params);
    return await this.findById(id);
  }

  /**
   * Delete news by ID
   * @param {number} id - News ID
   * @returns {Promise<boolean>} Success status
   */
  static async deleteById(id) {
    const sql = 'DELETE FROM news WHERE id = ?';
    const result = await runQuery(sql, [id]);
    return result.changes > 0;
  }

  /**
   * Check if news exists by slug
   * @param {string} slug - News slug
   * @param {number} excludeId - ID to exclude from check (for updates)
   * @returns {Promise<boolean>} Existence status
   */
  static async existsBySlug(slug, excludeId = null) {
    let sql = 'SELECT id FROM news WHERE slug = ?';
    let params = [slug];

    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }

    const existingNews = await getOne(sql, params);
    return !!existingNews;
  }

  /**
   * Get published news only
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Published news list
   */
  static async findPublished(options = {}) {
    return await this.findAll({ ...options, status: 'published' });
  }

  /**
   * Get news by category
   * @param {number} categoryId - Category ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} News list by category
   */
  static async findByCategory(categoryId, options = {}) {
    return await this.findAll({ ...options, category_id: categoryId });
  }

  /**
   * Get news by author
   * @param {number} authorId - Author ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} News list by author
   */
  static async findByAuthor(authorId, options = {}) {
    return await this.findAll({ ...options, author_id: authorId });
  }

  /**
   * Generate slug from title
   * @param {string} title - Title to convert to slug
   * @returns {string} Generated slug
   */
  static generateSlug(title) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .substring(0, 500); // Limit length
  }

  /**
   * Get latest news
   * @param {number} limit - Number of news to get
   * @returns {Promise<Array>} Latest news articles
   */
  static async getLatest(limit = 5) {
    const sql = `
      SELECT 
        n.id,
        n.title,
        n.summary,
        n.slug,
        n.featured_image,
        n.published_at,
        n.created_at,
        c.name as category_name,
        c.slug as category_slug,
        u.username as author_username,
        u.first_name as author_first_name,
        u.last_name as author_last_name
      FROM news n
      LEFT JOIN categories c ON n.category_id = c.id
      LEFT JOIN users u ON n.author_id = u.id
      WHERE n.status = 'published'
      ORDER BY n.published_at DESC
      LIMIT ?
    `;
    
    return await getAll(sql, [limit]);
  }

  /**
   * Search news by term
   * @param {string} searchTerm - Search term
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Search results
   */
  static async search(searchTerm, options = {}) {
    return await this.findAll({ ...options, search: searchTerm });
  }
}

module.exports = News; 