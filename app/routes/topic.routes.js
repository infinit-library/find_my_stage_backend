const express = require('express');
const TopicController = require('../controllers/topic.controller');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');

const router = express.Router();

// Public routes (no auth required)
router.get('/', optionalAuthMiddleware, TopicController.getTopics);
router.get('/popular', optionalAuthMiddleware, TopicController.getPopularTopics);
router.get('/search', optionalAuthMiddleware, TopicController.searchTopics);
router.get('/:id', optionalAuthMiddleware, TopicController.getTopicById);

// Protected routes (auth required)
router.use(authMiddleware);

router.post('/', TopicController.createTopic);
router.put('/:id', TopicController.updateTopic);
router.delete('/:id', TopicController.deleteTopic);
router.post('/:id/join', TopicController.addUserToTopic);
router.delete('/:id/leave', TopicController.removeUserFromTopic);
router.get('/my/topics', TopicController.getUserTopics);

module.exports = router;
