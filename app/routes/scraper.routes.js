const express = require('express');
const router = express.Router();
const scraperController = require('../controllers/scraper.controller');
const { authMiddleware } = require('../middleware/auth');

// Test scraper functionality (no auth required for testing)
router.get('/test', scraperController.testScraper);

// Test PaperCall scraper functionality (no auth required for testing)
router.get('/test-papercall', scraperController.testPaperCallScraper);

// Test Playwright pagination scraper functionality (no auth required for testing)
router.get('/test-playwright-pagination', scraperController.testPlaywrightPaginationScraper);

// Test Pretalx scraper functionality (no auth required for testing)
router.get('/test-pretalx', scraperController.testPretalxScraper);

// Get ALL PaperCall.io events (no auth required for testing)
router.get('/all-papercall-events', scraperController.getAllPaperCallEvents);

// Scrape and save ALL 272 events to database (no auth required for testing)
router.get('/scrape-and-save-all-events', scraperController.scrapeAndSaveAllEvents);

// Scrape Eventbrite events
router.post('/eventbrite', authMiddleware, scraperController.scrapeEventbriteEvents);

// Scrape PaperCall.io events
router.post('/papercall', authMiddleware, scraperController.scrapePaperCallEvents);

// Scrape events using Playwright with full pagination support
router.post('/playwright-pagination', authMiddleware, scraperController.scrapeWithPlaywrightPagination);

// Scrape Pretalx events (public endpoint for search functionality)
router.post('/pretalx', (req, res) => scraperController.scrapePretalxEvents(req, res));

// Get all Pretalx event IDs automatically
router.post('/pretalx/event-ids', authMiddleware, scraperController.getAllPretalxEventIds);

// Get Pretalx event slugs
router.post('/pretalx/slugs', authMiddleware, scraperController.getPretalxEventSlugs);

// Get specific Pretalx event details
router.get('/pretalx/event/:slug', authMiddleware, scraperController.getPretalxEventDetails);

// Get scraping statistics
router.get('/stats', authMiddleware, scraperController.getScrapingStats);

// Get detailed event information
router.get('/event-details/:eventUrl', authMiddleware, scraperController.getEventDetails);

// Schedule automatic scraping
router.post('/schedule', authMiddleware, scraperController.scheduleScraping);

// Clean up old events
router.delete('/cleanup', authMiddleware, scraperController.cleanupOldEvents);

module.exports = router;
