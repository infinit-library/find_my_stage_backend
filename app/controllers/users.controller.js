const UserModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class UsersController {
  // Get user profile
  static async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const user = await UserModel.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const updateData = req.body;

      // Remove sensitive fields that shouldn't be updated through this endpoint
      delete updateData.password;
      delete updateData.email;
      delete updateData.id;
      delete updateData.createdAt;
      delete updateData.updatedAt;

      const user = await UserModel.update(userId, updateData);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: user
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Change password
  static async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 8 characters long'
        });
      }

      // Get user with password
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await UserModel.update(userId, { password: hashedNewPassword });

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Upload profile picture
  static async uploadProfilePicture(req, res) {
    try {
      const userId = req.user.id;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const profilePictureUrl = `/uploads/${req.file.filename}`;
      const user = await UserModel.update(userId, { profilePicture: profilePictureUrl });

      res.json({
        success: true,
        message: 'Profile picture uploaded successfully',
        data: {
          profilePicture: user.profilePicture
        }
      });
    } catch (error) {
      console.error('Upload profile picture error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Delete user account
  static async deleteAccount(req, res) {
    try {
      const userId = req.user.id;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password is required to delete account'
        });
      }

      // Get user with password
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Password is incorrect'
        });
      }

      // Delete user
      await UserModel.delete(userId);

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get user statistics
  static async getUserStats(req, res) {
    try {
      const userId = req.user.id;
      
      // This would typically involve more complex queries
      // For now, we'll return basic stats
      const user = await UserModel.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const stats = {
        profileCompleteness: calculateProfileCompleteness(user),
        memberSince: user.createdAt,
        isVerified: user.isVerified,
        isActive: user.isActive
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Search users
  static async searchUsers(req, res) {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      
      const result = await UserModel.findAll(
        parseInt(page),
        parseInt(limit),
        search
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Search users error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get user by ID (public profile)
  static async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await UserModel.findById(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Remove sensitive information for public profile
      const publicProfile = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        bio: user.bio,
        location: user.location,
        website: user.website,
        linkedin: user.linkedin,
        twitter: user.twitter,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      };

      res.json({
        success: true,
        data: publicProfile
      });
    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

// Helper function to calculate profile completeness
function calculateProfileCompleteness(user) {
  const fields = [
    'firstName',
    'lastName',
    'bio',
    'location',
    'website',
    'linkedin',
    'twitter',
    'profilePicture'
  ];

  const completedFields = fields.filter(field => user[field] && user[field].trim() !== '');
  return Math.round((completedFields.length / fields.length) * 100);
}

module.exports = UsersController;
