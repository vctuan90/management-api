const News = require('../models/News');
const Category = require('../models/Category');
const logger = require('../utils/logger');

class NewsController {
  /**
   * Get all news with pagination and filtering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getAllNews(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sort: req.query.sort || 'created_at',
        order: req.query.order || 'desc',
        status: req.query.status,
        category_id: req.query.category_id ? parseInt(req.query.category_id) : undefined,
        author_id: req.query.author_id ? parseInt(req.query.author_id) : undefined,
        search: req.query.search
      };

      const result = await News.findAll(options);

      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      logger.error('Get all news error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve news'
      });
    }
  }

  /**
   * Get published news only
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getPublishedNews(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sort: req.query.sort || 'published_at',
        order: req.query.order || 'desc',
        category_id: req.query.category_id ? parseInt(req.query.category_id) : undefined,
        search: req.query.search
      };

      const result = await News.findPublished(options);

      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      logger.error('Get published news error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve published news'
      });
    }
  }

  /**
   * Get latest news
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getLatestNews(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 5;
      const news = await News.getLatest(limit);

      res.status(200).json({
        status: 'success',
        data: { news }
      });
    } catch (error) {
      logger.error('Get latest news error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve latest news'
      });
    }
  }

  /**
   * Get news by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getNewsById(req, res) {
    try {
      const newsId = req.params.id;
      const news = await News.findById(newsId);

      if (!news) {
        return res.status(404).json({
          status: 'error',
          message: 'News article not found'
        });
      }

      res.status(200).json({
        status: 'success',
        data: { news }
      });
    } catch (error) {
      logger.error('Get news by ID error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve news article'
      });
    }
  }

  /**
   * Get news by slug
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getNewsBySlug(req, res) {
    try {
      const slug = req.params.slug;
      const news = await News.findBySlug(slug);

      if (!news) {
        return res.status(404).json({
          status: 'error',
          message: 'News article not found'
        });
      }

      res.status(200).json({
        status: 'success',
        data: { news }
      });
    } catch (error) {
      logger.error('Get news by slug error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve news article'
      });
    }
  }

  /**
   * Get news by category
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getNewsByCategory(req, res) {
    try {
      const categoryId = req.params.categoryId;
      
      // Check if category exists
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({
          status: 'error',
          message: 'Category not found'
        });
      }

      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sort: req.query.sort || 'published_at',
        order: req.query.order || 'desc',
        search: req.query.search
      };

      const result = await News.findByCategory(categoryId, options);

      res.status(200).json({
        status: 'success',
        data: {
          category,
          ...result
        }
      });
    } catch (error) {
      logger.error('Get news by category error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve news by category'
      });
    }
  }

  /**
   * Create a new news article
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async createNews(req, res) {
    try {
      const { title, content, summary, slug, featured_image, status, category_id } = req.body;
      const author_id = req.user.id;

      // Generate slug if not provided
      const finalSlug = slug || News.generateSlug(title);

      // Check if slug exists
      const slugExists = await News.existsBySlug(finalSlug);
      if (slugExists) {
        return res.status(400).json({
          status: 'error',
          message: 'News article with this slug already exists'
        });
      }

      // Verify category exists if provided
      if (category_id) {
        const category = await Category.findById(category_id);
        if (!category) {
          return res.status(400).json({
            status: 'error',
            message: 'Category not found'
          });
        }
      }

      // Create news article
      const news = await News.create({
        title,
        content,
        summary,
        slug: finalSlug,
        featured_image,
        status: status || 'draft',
        category_id,
        author_id
      });

      logger.info(`New news article created: ${news.title} by ${req.user.email}`);

      res.status(201).json({
        status: 'success',
        message: 'News article created successfully',
        data: { news }
      });
    } catch (error) {
      logger.error('Create news error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create news article'
      });
    }
  }

  /**
   * Update news by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async updateNews(req, res) {
    try {
      const newsId = req.params.id;
      const updateData = req.body;

      // Check if news exists
      const existingNews = await News.findById(newsId);
      if (!existingNews) {
        return res.status(404).json({
          status: 'error',
          message: 'News article not found'
        });
      }

      // Check authorization (author or admin/editor)
      if (req.user.role !== 'admin' && 
          req.user.role !== 'editor' && 
          req.user.id !== existingNews.author_id) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied - you can only edit your own articles'
        });
      }

      // Generate slug if title is being updated but slug is not provided
      if (updateData.title && !updateData.slug) {
        updateData.slug = News.generateSlug(updateData.title);
      }

      // Check if slug exists (if being updated)
      if (updateData.slug) {
        const slugExists = await News.existsBySlug(updateData.slug, newsId);
        if (slugExists) {
          return res.status(400).json({
            status: 'error',
            message: 'Another news article with this slug already exists'
          });
        }
      }

      // Verify category exists if provided
      if (updateData.category_id) {
        const category = await Category.findById(updateData.category_id);
        if (!category) {
          return res.status(400).json({
            status: 'error',
            message: 'Category not found'
          });
        }
      }

      // Update news article
      const updatedNews = await News.updateById(newsId, updateData);

      logger.info(`News article updated: ${updatedNews.title} by ${req.user.email}`);

      res.status(200).json({
        status: 'success',
        message: 'News article updated successfully',
        data: { news: updatedNews }
      });
    } catch (error) {
      logger.error('Update news error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update news article'
      });
    }
  }

  /**
   * Delete news by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async deleteNews(req, res) {
    try {
      const newsId = req.params.id;

      // Check if news exists
      const news = await News.findById(newsId);
      if (!news) {
        return res.status(404).json({
          status: 'error',
          message: 'News article not found'
        });
      }

      // Check authorization (author or admin/editor)
      if (req.user.role !== 'admin' && 
          req.user.role !== 'editor' && 
          req.user.id !== news.author_id) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied - you can only delete your own articles'
        });
      }

      // Delete news article
      const deleted = await News.deleteById(newsId);
      
      if (!deleted) {
        return res.status(400).json({
          status: 'error',
          message: 'Failed to delete news article'
        });
      }

      logger.info(`News article deleted: ${news.title} by ${req.user.email}`);

      res.status(200).json({
        status: 'success',
        message: 'News article deleted successfully'
      });
    } catch (error) {
      logger.error('Delete news error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete news article'
      });
    }
  }

  /**
   * Search news articles
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async searchNews(req, res) {
    try {
      const searchTerm = req.query.q;
      
      if (!searchTerm || searchTerm.trim().length < 2) {
        return res.status(400).json({
          status: 'error',
          message: 'Search term must be at least 2 characters long'
        });
      }

      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        status: req.query.status || 'published', // Default to published for public search
        category_id: req.query.category_id ? parseInt(req.query.category_id) : undefined
      };

      const result = await News.search(searchTerm, options);

      res.status(200).json({
        status: 'success',
        data: {
          search_term: searchTerm,
          ...result
        }
      });
    } catch (error) {
      logger.error('Search news error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to search news articles'
      });
    }
  }

  /**
   * Get user's own news articles
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getMyNews(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sort: req.query.sort || 'created_at',
        order: req.query.order || 'desc',
        status: req.query.status,
        category_id: req.query.category_id ? parseInt(req.query.category_id) : undefined,
        search: req.query.search
      };

      const result = await News.findByAuthor(req.user.id, options);

      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      logger.error('Get my news error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve your news articles'
      });
    }
  }
}

module.exports = NewsController; 