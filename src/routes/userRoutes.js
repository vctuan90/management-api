const express = require('express');
const router = express.Router();

const UserController = require('../controllers/userController');
const { authenticateToken, authorize } = require('../middlewares/auth');
const { validate, validateId, userSchemas, combinedQuerySchemas } = require('../utils/validation');

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filtering
 * @access  Private (Admin/Editor only)
 */
router.get('/',
  authenticateToken,
  authorize('admin', 'editor'),
  validate(combinedQuerySchemas.userList, 'query'),
  UserController.getAllUsers
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin/Editor only)
 */
router.get('/:id',
  authenticateToken,
  authorize('admin', 'editor'),
  validateId,
  UserController.getUserById
);

/**
 * @route   POST /api/users
 * @desc    Create a new user
 * @access  Private (Admin only)
 */
router.post('/',
  authenticateToken,
  authorize('admin'),
  validate(userSchemas.register),
  UserController.createUser
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user by ID
 * @access  Private (Admin/Editor or self)
 */
router.put('/:id',
  authenticateToken,
  validateId,
  validate(userSchemas.update),
  UserController.updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user by ID
 * @access  Private (Admin only)
 */
router.delete('/:id',
  authenticateToken,
  authorize('admin'),
  validateId,
  UserController.deleteUser
);

/**
 * @route   PATCH /api/users/:id/toggle-status
 * @desc    Toggle user active status
 * @access  Private (Admin only)
 */
router.patch('/:id/toggle-status',
  authenticateToken,
  authorize('admin'),
  validateId,
  UserController.toggleUserStatus
);

/**
 * @route   PUT /api/users/:id/reset-password
 * @desc    Reset user password
 * @access  Private (Admin only)
 */
router.put('/:id/reset-password',
  authenticateToken,
  authorize('admin'),
  validateId,
  validate(userSchemas.resetPassword),
  UserController.resetPassword
);

module.exports = router; 