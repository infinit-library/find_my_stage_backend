const express = require('express');
const router = express.Router();
const scraperController = require('../controllers/scraper.controller');
const { authMiddleware } = require('../middleware/auth');

// Test scraper functionality (no auth required for testing)
router.get('/test', scraperController.testScraper);

// Scrape Eventbrite events
router.post('/eventbrite', authMiddleware, scraperController.scrapeEventbriteEvents);

// Get scraping statistics
router.get('/stats', authMiddleware, scraperController.getScrapingStats);

// Get detailed event information
router.get('/event-details/:eventUrl', authMiddleware, scraperController.getEventDetails);

// Schedule automatic scraping
router.post('/schedule', authMiddleware, scraperController.scheduleScraping);

// Clean up old events
router.delete('/cleanup', authMiddleware, scraperController.cleanupOldEvents);

module.exports = router;
