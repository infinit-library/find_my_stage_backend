const passport = require('passport');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');
const bcrypt = require('bcryptjs');

class GoogleAuthController {

  static async googleLogin(req, res, next) {
    passport.authenticate('google', {
      scope: ['profile', 'email']
    })(req, res, next);
  }


  static async googleCallback(req, res, next) {
    passport.authenticate('google', async (err, user, info) => {
      try {
        if (err) {
          console.error('Google auth error:', err);
          return res.redirect(`${process.env.FRONTEND_URL}/auth?error=authentication_failed`);
        }
        if (!user) {
          return res.redirect(`${process.env.FRONTEND_URL}/auth?error=authentication_failed`);
        }

        let dbUser = await UserModel.findByEmail(user.email);
        if (!dbUser) {

          const newUserData = {
            email: user.email,
            firstName: user.firstName || user.displayName?.split(' ')[0] || '',
            lastName: user.lastName || user.displayName?.split(' ').slice(1).join(' ') || '',
            profilePicture: user.photos?.[0]?.value || null,
            isVerified: true,
            googleId: user.id,
            password: await bcrypt.hash(Math.random().toString(36), 12)
          };
          dbUser = await UserModel.create(newUserData);
        } else {

          if (!dbUser.googleId) {
            await UserModel.update(dbUser.id, {
              googleId: user.id,
              isVerified: true
            });
          }
        }

        const accessToken = jwt.sign(
          {
            id: dbUser.id,
            email: dbUser.email
          },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );
        const refreshToken = jwt.sign(
          {
            id: dbUser.id,
            email: dbUser.email
          },
          process.env.JWT_REFRESH_SECRET,
          { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
        );

        const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}&refresh=${refreshToken}`;
        res.redirect(redirectUrl);

      } catch (error) {
        console.error('Google callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/auth?error=server_error`);
      }
    })(req, res, next);
  }


  static async getGoogleAuthUrl(req, res) {
    try {
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(process.env.GOOGLE_CALLBACK_URL)}&` +
        `scope=profile email&` +
        `response_type=code&` +
        `access_type=offline&` +
        `prompt=consent`;
      res.json({
        success: true,
        data: {
          authUrl
        }
      });
    } catch (error) {
      console.error('Get Google auth URL error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }


  static async linkGoogleAccount(req, res) {
    try {
      const userId = req.user.id;
      const { googleToken } = req.body;
      if (!googleToken) {
        return res.status(400).json({
          success: false,
          message: 'Google token is required'
        });
      }




      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await UserModel.update(userId, {
        googleId: googleToken,
        isVerified: true
      });
      res.json({
        success: true,
        message: 'Google account linked successfully'
      });
    } catch (error) {
      console.error('Link Google account error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }


  static async unlinkGoogleAccount(req, res) {
    try {
      const userId = req.user.id;
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      if (!user.googleId) {
        return res.status(400).json({
          success: false,
          message: 'No Google account linked'
        });
      }

      if (!user.password) {
        return res.status(400).json({
          success: false,
          message: 'Cannot unlink Google account. Please set a password first.'
        });
      }

      await UserModel.update(userId, { googleId: null });
      res.json({
        success: true,
        message: 'Google account unlinked successfully'
      });
    } catch (error) {
      console.error('Unlink Google account error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = GoogleAuthController;
