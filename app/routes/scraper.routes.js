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
// Get scraping statistics
router.get('/stats', authMiddleware, scraperController.getScrapingStats);

// Get detailed event information
router.get('/event-details/:eventUrl', authMiddleware, scraperController.getEventDetails);

// Schedule automatic scraping
router.post('/schedule', authMiddleware, scraperController.scheduleScraping);

// Clean up old events
router.delete('/cleanup', authMiddleware, scraperController.cleanupOldEvents);

module.exports = router;
