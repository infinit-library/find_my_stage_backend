const express = require('express');
const multer = require('multer');
const path = require('path');
const UsersController = require('../controllers/users.controller');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// All routes require authentication
router.use(authMiddleware);

// User profile routes
router.get('/profile', UsersController.getProfile);
router.put('/profile', UsersController.updateProfile);
router.post('/profile/picture', upload.single('profilePicture'), UsersController.uploadProfilePicture);

// Password management
router.put('/change-password', UsersController.changePassword);

// User statistics
router.get('/stats', UsersController.getUserStats);

// Account management
router.delete('/account', UsersController.deleteAccount);

// Public user routes (no auth required)
router.get('/search', UsersController.searchUsers);
router.get('/:id', UsersController.getUserById);

module.exports = router;
