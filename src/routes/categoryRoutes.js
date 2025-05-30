const express = require('express');
const router = express.Router();

const CategoryController = require('../controllers/categoryController');
const { authenticateToken, authorize, optionalAuth } = require('../middlewares/auth');
const { validate, validateId, categorySchemas, combinedQuerySchemas } = require('../utils/validation');

/**
 * @route   GET /api/categories
 * @desc    Get all categories with pagination and filtering
 * @access  Public/Private (depends on query params)
 */
router.get('/',
  optionalAuth,
  validate(combinedQuerySchemas.categoryList, 'query'),
  CategoryController.getAllCategories
);

/**
 * @route   GET /api/categories/active
 * @desc    Get active categories only
 * @access  Public
 */
router.get('/active',
  CategoryController.getActiveCategories
);

/**
 * @route   GET /api/categories/:id
 * @desc    Get category by ID
 * @access  Public
 */
router.get('/:id',
  validateId,
  CategoryController.getCategoryById
);

/**
 * @route   GET /api/categories/slug/:slug
 * @desc    Get category by slug
 * @access  Public
 */
router.get('/slug/:slug',
  CategoryController.getCategoryBySlug
);

/**
 * @route   POST /api/categories
 * @desc    Create a new category
 * @access  Private (Admin/Editor only)
 */
router.post('/',
  authenticateToken,
  authorize('admin', 'editor'),
  validate(categorySchemas.create),
  CategoryController.createCategory
);

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category by ID
 * @access  Private (Admin/Editor only)
 */
router.put('/:id',
  authenticateToken,
  authorize('admin', 'editor'),
  validateId,
  validate(categorySchemas.update),
  CategoryController.updateCategory
);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category by ID
 * @access  Private (Admin only)
 */
router.delete('/:id',
  authenticateToken,
  authorize('admin'),
  validateId,
  CategoryController.deleteCategory
);

/**
 * @route   PATCH /api/categories/:id/toggle-status
 * @desc    Toggle category active status
 * @access  Private (Admin/Editor only)
 */
router.patch('/:id/toggle-status',
  authenticateToken,
  authorize('admin', 'editor'),
  validateId,
  CategoryController.toggleCategoryStatus
);

module.exports = router; 