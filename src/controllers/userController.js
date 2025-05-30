const User = require('../models/User');
const logger = require('../utils/logger');

class UserController {
  /**
   * Get all users with pagination and filtering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getAllUsers(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sort: req.query.sort || 'created_at',
        order: req.query.order || 'desc',
        role: req.query.role,
        is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
        search: req.query.search
      };

      const result = await User.findAll(options);

      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      logger.error('Get all users error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve users'
      });
    }
  }

  /**
   * Get user by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getUserById(req, res) {
    try {
      const userId = req.params.id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      res.status(200).json({
        status: 'success',
        data: { user }
      });
    } catch (error) {
      logger.error('Get user by ID error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve user'
      });
    }
  }

  /**
   * Create a new user (Admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async createUser(req, res) {
    try {
      const { username, email, password, first_name, last_name, role } = req.body;

      // Check if user already exists
      const existsCheck = await User.checkExists(email, username);
      if (existsCheck.exists) {
        return res.status(400).json({
          status: 'error',
          message: `User with this ${existsCheck.field} already exists`
        });
      }

      // Create new user
      const user = await User.create({
        username,
        email,
        password,
        first_name,
        last_name,
        role: role || 'user'
      });

      logger.info(`New user created by admin: ${user.email}`);

      res.status(201).json({
        status: 'success',
        message: 'User created successfully',
        data: { user }
      });
    } catch (error) {
      logger.error('Create user error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create user'
      });
    }
  }

  /**
   * Update user by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async updateUser(req, res) {
    try {
      const userId = req.params.id;
      const updateData = req.body;

      // Check if user exists
      const existingUser = await User.findById(userId);
      if (!existingUser) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      // Check if email or username is taken by another user
      if (updateData.email || updateData.username) {
        const existsCheck = await User.checkExists(
          updateData.email || existingUser.email,
          updateData.username || existingUser.username,
          userId
        );
        
        if (existsCheck.exists) {
          return res.status(400).json({
            status: 'error',
            message: `Another user with this ${existsCheck.field} already exists`
          });
        }
      }

      // Prevent users from changing their own role (unless they're admin)
      if (req.user.id === parseInt(userId) && updateData.role && req.user.role !== 'admin') {
        delete updateData.role;
      }

      // Update user
      const updatedUser = await User.updateById(userId, updateData);

      logger.info(`User updated: ${updatedUser.email} by ${req.user.email}`);

      res.status(200).json({
        status: 'success',
        message: 'User updated successfully',
        data: { user: updatedUser }
      });
    } catch (error) {
      logger.error('Update user error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update user'
      });
    }
  }

  /**
   * Delete user by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async deleteUser(req, res) {
    try {
      const userId = req.params.id;

      // Prevent users from deleting themselves
      if (req.user.id === parseInt(userId)) {
        return res.status(400).json({
          status: 'error',
          message: 'You cannot delete your own account'
        });
      }

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      // Delete user
      const deleted = await User.deleteById(userId);
      
      if (!deleted) {
        return res.status(400).json({
          status: 'error',
          message: 'Failed to delete user'
        });
      }

      logger.info(`User deleted: ${user.email} by ${req.user.email}`);

      res.status(200).json({
        status: 'success',
        message: 'User deleted successfully'
      });
    } catch (error) {
      logger.error('Delete user error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete user'
      });
    }
  }

  /**
   * Toggle user active status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async toggleUserStatus(req, res) {
    try {
      const userId = req.params.id;

      // Prevent users from deactivating themselves
      if (req.user.id === parseInt(userId)) {
        return res.status(400).json({
          status: 'error',
          message: 'You cannot change your own status'
        });
      }

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      // Toggle status
      const updatedUser = await User.updateById(userId, {
        is_active: !user.is_active
      });

      logger.info(`User status changed: ${updatedUser.email} (${updatedUser.is_active ? 'activated' : 'deactivated'}) by ${req.user.email}`);

      res.status(200).json({
        status: 'success',
        message: `User ${updatedUser.is_active ? 'activated' : 'deactivated'} successfully`,
        data: { user: updatedUser }
      });
    } catch (error) {
      logger.error('Toggle user status error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to change user status'
      });
    }
  }

  /**
   * Reset user password (Admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async resetPassword(req, res) {
    try {
      const userId = req.params.id;
      const { new_password } = req.body;

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      // Reset password
      await User.changePassword(userId, new_password);

      logger.info(`Password reset for user: ${user.email} by admin: ${req.user.email}`);

      res.status(200).json({
        status: 'success',
        message: 'Password reset successfully'
      });
    } catch (error) {
      logger.error('Reset password error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to reset password'
      });
    }
  }
}

module.exports = UserController;