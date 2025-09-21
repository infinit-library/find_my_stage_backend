const UserModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class UsersController {

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


  static async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const updateData = req.body;

    
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

    
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

    
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

    
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    
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

    
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

    
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Password is incorrect'
        });
      }

    
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


  static async getUserStats(req, res) {
    try {
      const userId = req.user.id;
      
    
    
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
        isVerified: user.isEmailVerified,
        status: user.status
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
        isVerified: user.isEmailVerified,
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
