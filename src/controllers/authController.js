const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

class AuthController {
  /**
   * Register a new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async register(req, res) {
    try {
      const { username, email, password, first_name, last_name } = req.body;

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
        last_name
      });

      logger.info(`New user registered: ${user.email}`);

      res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role
          }
        }
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Registration failed'
      });
    }
  }

  /**
   * Login user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user by email (including password for verification)
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid email or password'
        });
      }

      // Check if user is active
      if (!user.is_active) {
        return res.status(401).json({
          status: 'error',
          message: 'Account is deactivated'
        });
      }

      // Verify password
      const isPasswordValid = await User.verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid email or password'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id,
          email: user.email,
          role: user.role
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { 
          expiresIn: process.env.JWT_EXPIRE || '24h'
        }
      );

      logger.info(`User logged in: ${user.email}`);

      res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role
          }
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Login failed'
      });
    }
  }

  /**
   * Get current user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getProfile(req, res) {
    try {
      const user = req.user; // Set by authentication middleware

      res.status(200).json({
        status: 'success',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            is_active: user.is_active,
            created_at: user.created_at
          }
        }
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get profile'
      });
    }
  }

  /**
   * Update user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { username, email, first_name, last_name } = req.body;

      // Check if email or username is taken by another user
      if (email || username) {
        const existsCheck = await User.checkExists(
          email || req.user.email,
          username || req.user.username,
          userId
        );
        
        if (existsCheck.exists) {
          return res.status(400).json({
            status: 'error',
            message: `Another user with this ${existsCheck.field} already exists`
          });
        }
      }

      // Update user
      const updatedUser = await User.updateById(userId, {
        username,
        email,
        first_name,
        last_name
      });

      logger.info(`User profile updated: ${updatedUser.email}`);

      res.status(200).json({
        status: 'success',
        message: 'Profile updated successfully',
        data: {
          user: {
            id: updatedUser.id,
            username: updatedUser.username,
            email: updatedUser.email,
            first_name: updatedUser.first_name,
            last_name: updatedUser.last_name,
            role: updatedUser.role
          }
        }
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update profile'
      });
    }
  }

  /**
   * Change password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { current_password, new_password } = req.body;

      // Get user with password to verify current password
      const user = await User.findByEmail(req.user.email);
      
      // Verify current password
      const isCurrentPasswordValid = await User.verifyPassword(current_password, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          status: 'error',
          message: 'Current password is incorrect'
        });
      }

      // Update password
      await User.changePassword(userId, new_password);

      logger.info(`Password changed for user: ${user.email}`);

      res.status(200).json({
        status: 'success',
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error('Change password error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to change password'
      });
    }
  }

  /**
   * Logout (client-side token invalidation)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async logout(req, res) {
    try {
      // In a JWT-based system, logout is typically handled client-side
      // by removing the token from storage
      logger.info(`User logged out: ${req.user.email}`);

      res.status(200).json({
        status: 'success',
        message: 'Logout successful'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Logout failed'
      });
    }
  }
}

module.exports = AuthController; 