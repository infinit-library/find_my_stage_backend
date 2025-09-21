const express = require('express');
const EventController = require('../controllers/event.controller');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/call-for-data-speakers-events', EventController.getCallForDataSpeakersEvents);
router.get('/call-for-data-speakers/stats', EventController.getCallForDataSpeakersStats);
router.get('/call-for-data-speakers/region/:region', EventController.getCallForDataSpeakersEventsByRegion);
router.get('/call-for-data-speakers/search', EventController.searchCallForDataSpeakersEvents);
router.get('/call-for-data-speakers/openai-search', EventController.searchCallForDataSpeakersEventsWithOpenAI);

// Public routes (no auth required)
router.get('/', optionalAuthMiddleware, EventController.getEvents);
router.get('/upcoming', optionalAuthMiddleware, EventController.getUpcomingEvents);
router.get('/limited', optionalAuthMiddleware, EventController.getLimitedEvents);
router.get('/ticketmaster', optionalAuthMiddleware, EventController.getTicketmasterEvents);
router.get('/eventbrite', optionalAuthMiddleware, EventController.getEventbriteEvents);
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
