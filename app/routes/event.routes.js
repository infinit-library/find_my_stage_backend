const express = require('express');
const EventController = require('../controllers/event.controller');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');

const router = express.Router();

// Public routes (no auth required)
router.get('/', optionalAuthMiddleware, EventController.getEvents);
router.get('/upcoming', optionalAuthMiddleware, EventController.getUpcomingEvents);
router.get('/limited', optionalAuthMiddleware, EventController.getLimitedEvents);
router.get('/:id', optionalAuthMiddleware, EventController.getEventById);

// Protected routes (auth required)
router.use(authMiddleware);

router.post('/', EventController.createEvent);
router.put('/:id', EventController.updateEvent);
router.delete('/:id', EventController.deleteEvent);
router.get('/my/events', EventController.getUserEvents);
router.post('/:id/speakers', EventController.addSpeaker);
router.delete('/:id/speakers/:userId', EventController.removeSpeaker);

module.exports = router;
