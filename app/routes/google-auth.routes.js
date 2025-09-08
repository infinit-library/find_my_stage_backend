const express = require('express');
const passport = require('passport');
const GoogleAuthController = require('../controllers/google-auth.controller');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Google OAuth routes
router.get('/login', GoogleAuthController.googleLogin);
router.get('/callback', GoogleAuthController.googleCallback);
router.get('/url', GoogleAuthController.getGoogleAuthUrl);

// Google account management (requires authentication)
router.use(authMiddleware);
router.post('/link', GoogleAuthController.linkGoogleAccount);
router.delete('/unlink', GoogleAuthController.unlinkGoogleAccount);

module.exports = router;
