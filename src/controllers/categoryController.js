const Category = require('../models/Category');
const logger = require('../utils/logger');

class CategoryController {
  /**
   * Get all categories with pagination and filtering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getAllCategories(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sort: req.query.sort || 'created_at',
        order: req.query.order || 'desc',
        is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
        search: req.query.search
      };

      const result = await Category.findAll(options);

      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      logger.error('Get all categories error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve categories'
      });
    }
  }

  /**
   * Get active categories only
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getActiveCategories(req, res) {
    try {
      const categories = await Category.findActive();

      res.status(200).json({
        status: 'success',
        data: { categories }
      });
    } catch (error) {
      logger.error('Get active categories error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve active categories'
      });
    }
  }

  /**
   * Get category by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getCategoryById(req, res) {
    try {
      const categoryId = req.params.id;
      const category = await Category.findByIdWithNewsCount(categoryId);

      if (!category) {
        return res.status(404).json({
          status: 'error',
          message: 'Category not found'
        });
      }

      res.status(200).json({
        status: 'success',
        data: { category }
      });
    } catch (error) {
      logger.error('Get category by ID error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve category'
      });
    }
  }

  /**
   * Get category by slug
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getCategoryBySlug(req, res) {
    try {
      const slug = req.params.slug;
      const category = await Category.findBySlug(slug);

      if (!category) {
        return res.status(404).json({
          status: 'error',
          message: 'Category not found'
        });
      }

      res.status(200).json({
        status: 'success',
        data: { category }
      });
    } catch (error) {
      logger.error('Get category by slug error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve category'
      });
    }
  }

  /**
   * Create a new category
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async createCategory(req, res) {
    try {
      const { name, description, slug } = req.body;

      // Generate slug if not provided
      const finalSlug = slug || Category.generateSlug(name);

      // Check if category with same name or slug exists
      const existsCheck = await Category.checkExists(name, finalSlug);
      if (existsCheck.exists) {
        return res.status(400).json({
          status: 'error',
          message: `Category with this ${existsCheck.field} already exists`
        });
      }

      // Create category
      const category = await Category.create({
        name,
        description,
        slug: finalSlug
      });

      logger.info(`New category created: ${category.name} by ${req.user.email}`);

      res.status(201).json({
        status: 'success',
        message: 'Category created successfully',
        data: { category }
      });
    } catch (error) {
      logger.error('Create category error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create category'
      });
    }
  }

  /**
   * Update category by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async updateCategory(req, res) {
    try {
      const categoryId = req.params.id;
      const updateData = req.body;

      // Check if category exists
      const existingCategory = await Category.findById(categoryId);
      if (!existingCategory) {
        return res.status(404).json({
          status: 'error',
          message: 'Category not found'
        });
      }

      // Generate slug if name is being updated but slug is not provided
      if (updateData.name && !updateData.slug) {
        updateData.slug = Category.generateSlug(updateData.name);
      }

      // Check if name or slug is taken by another category
      if (updateData.name || updateData.slug) {
        const existsCheck = await Category.checkExists(
          updateData.name || existingCategory.name,
          updateData.slug || existingCategory.slug,
          categoryId
        );
        
        if (existsCheck.exists) {
          return res.status(400).json({
            status: 'error',
            message: `Another category with this ${existsCheck.field} already exists`
          });
        }
      }

      // Update category
      const updatedCategory = await Category.updateById(categoryId, updateData);

      logger.info(`Category updated: ${updatedCategory.name} by ${req.user.email}`);

      res.status(200).json({
        status: 'success',
        message: 'Category updated successfully',
        data: { category: updatedCategory }
      });
    } catch (error) {
      logger.error('Update category error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update category'
      });
    }
  }

  /**
   * Delete category by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async deleteCategory(req, res) {
    try {
      const categoryId = req.params.id;

      // Check if category exists
      const category = await Category.findByIdWithNewsCount(categoryId);
      if (!category) {
        return res.status(404).json({
          status: 'error',
          message: 'Category not found'
        });
      }

      // Check if category has news articles
      if (category.news_count > 0) {
        return res.status(400).json({
          status: 'error',
          message: `Cannot delete category. It has ${category.news_count} news article(s) associated with it`
        });
      }

      // Delete category
      const deleted = await Category.deleteById(categoryId);
      
      if (!deleted) {
        return res.status(400).json({
          status: 'error',
          message: 'Failed to delete category'
        });
      }

      logger.info(`Category deleted: ${category.name} by ${req.user.email}`);

      res.status(200).json({
        status: 'success',
        message: 'Category deleted successfully'
      });
    } catch (error) {
      logger.error('Delete category error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete category'
      });
    }
  }

  /**
   * Toggle category active status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async toggleCategoryStatus(req, res) {
    try {
      const categoryId = req.params.id;

      // Check if category exists
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({
          status: 'error',
          message: 'Category not found'
        });
      }

      // Toggle status
      const updatedCategory = await Category.updateById(categoryId, {
        is_active: !category.is_active
      });

      logger.info(`Category status changed: ${updatedCategory.name} (${updatedCategory.is_active ? 'activated' : 'deactivated'}) by ${req.user.email}`);

      res.status(200).json({
        status: 'success',
        message: `Category ${updatedCategory.is_active ? 'activated' : 'deactivated'} successfully`,
        data: { category: updatedCategory }
      });
    } catch (error) {
      logger.error('Toggle category status error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to change category status'
      });
    }
  }
}

module.exports = CategoryController; 