const EventbriteScraperService = require('../services/eventbrite-scraper.service');
const EventbriteApiService = require('../services/eventbrite-api.service');
const PaperCallScraperService = require('../services/papercall-scraper.service');
const PlaywrightPaginationScraperService = require('../services/playwright-pagination-scraper.service');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const scraperService = new EventbriteScraperService();
const apiService = new EventbriteApiService(process.env.EVENTBRITE_API_KEY);
const paperCallScraperService = new PaperCallScraperService();
const playwrightPaginationScraperService = new PlaywrightPaginationScraperService();

/**
 * Clean text by removing newlines and extra whitespace
 * @param {string} text - Text to clean
 * @returns {string} Cleaned text
 */
function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/\n/g, ' ') // Replace newlines with spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim(); // Remove leading/trailing whitespace
}

class ScraperController {
  /**
   * Scrape Eventbrite Los Angeles events using API
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async scrapeEventbriteEvents(req, res) {
    try {
      const {
        maxEvents = 50,
        saveToDatabase = true,
        useApi = true,
        city = 'Los Angeles'
      } = req.body;

      console.log('Starting Eventbrite events request...');
      
      // Validate parameters
      if (maxEvents > 200) {
        return res.status(400).json({
          success: false,
          message: 'Maximum events limit is 200'
        });
      }

      let events = [];
      let saveResult = null;

      if (useApi && process.env.EVENTBRITE_API_KEY) {
        // Use API approach
        console.log('Using Eventbrite API...');
        events = await apiService.searchEvents(city, {
          'page_size': parseInt(maxEvents)
        });
      } else {
        // Fallback to scraping (may not work due to anti-bot measures)
        console.log('Using scraping approach (may be blocked)...');
        events = await scraperService.scrapeLosAngelesEvents({
          maxEvents: parseInt(maxEvents),
          headless: true,
          delay: 1000
        });
      }
      
      // Save to database if requested
      if (saveToDatabase && events.length > 0) {
        console.log('Saving events to database...');
        if (useApi && process.env.EVENTBRITE_API_KEY) {
          saveResult = await apiService.saveEventsToDatabase(events, prisma);
        } else {
          saveResult = await scraperService.saveEventsToDatabase(events, prisma);
        }
      }

      res.status(200).json({
        success: true,
        message: `Successfully fetched ${events.length} events`,
        data: {
          events: events,
          totalEvents: events.length,
          saveResult: saveResult,
          method: useApi && process.env.EVENTBRITE_API_KEY ? 'API' : 'Scraping'
        }
      });

    } catch (error) {
      console.error('Events fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch events',
        error: error.message
      });
    }
  }

  /**
   * Get scraping status and statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getScrapingStats(req, res) {
    try {
      // Get total events in database
      const totalEvents = await prisma.event.count();
      
      // Get events by source
      const eventsBySource = await prisma.event.groupBy({
        by: ['source'],
        _count: {
          source: true
        }
      });

      // Get recent events (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const recentEvents = await prisma.event.count({
        where: {
          scrapedAt: {
            gte: yesterday
          }
        }
      });

      // Get events by city
      const eventsByCity = await prisma.event.groupBy({
        by: ['city'],
        _count: {
          city: true
        },
        orderBy: {
          _count: {
            city: 'desc'
          }
        }
      });

      res.status(200).json({
        success: true,
        data: {
          totalEvents,
          recentEvents,
          eventsBySource,
          eventsByCity,
          lastUpdated: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error getting scraping stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get scraping statistics',
        error: error.message
      });
    }
  }

  /**
   * Get detailed event information
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getEventDetails(req, res) {
    try {
      const { eventUrl } = req.params;

      if (!eventUrl) {
        return res.status(400).json({
          success: false,
          message: 'Event URL is required'
        });
      }

      const details = await scraperService.getEventDetails(eventUrl);

      if (!details) {
        return res.status(404).json({
          success: false,
          message: 'Event details not found'
        });
      }

      res.status(200).json({
        success: true,
        data: details
      });

    } catch (error) {
      console.error('Error getting event details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get event details',
        error: error.message
      });
    }
  }

  /**
   * Schedule automatic scraping
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async scheduleScraping(req, res) {
    try {
      const {
        interval = 'daily', // daily, weekly, hourly
        maxEvents = 50,
        enabled = true
      } = req.body;

      // This would typically integrate with a job scheduler like node-cron
      // For now, we'll just return the configuration
      
      res.status(200).json({
        success: true,
        message: 'Scraping schedule configured',
        data: {
          interval,
          maxEvents,
          enabled,
          nextRun: this.calculateNextRun(interval)
        }
      });

    } catch (error) {
      console.error('Error scheduling scraping:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to schedule scraping',
        error: error.message
      });
    }
  }

  /**
   * Calculate next run time based on interval
   * @param {string} interval - Scraping interval
   * @returns {Date} Next run time
   */
  calculateNextRun(interval) {
    const now = new Date();
    
    switch (interval) {
      case 'hourly':
        return new Date(now.getTime() + 60 * 60 * 1000);
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Test scraper functionality
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async testScraper(req, res) {
    try {
      console.log('Testing scraper functionality...');
      
      // Test with minimal parameters
      const events = await scraperService.scrapeLosAngelesEvents({
        maxEvents: 5,
        headless: true,
        delay: 500
      });

      res.status(200).json({
        success: true,
        message: 'Scraper test successful',
        data: {
          eventsFound: events.length,
          sampleEvent: events[0] || null,
          testTimestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Scraper test failed:', error);
      res.status(500).json({
        success: false,
        message: 'Scraper test failed',
        error: error.message
      });
    }
  }

  /**
   * Scrape PaperCall.io events
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async scrapePaperCallEvents(req, res) {
    try {
      const {
        maxEvents = null, // Set to null to get ALL events
        saveToDatabase = true,
        headless = true
      } = req.body;

      console.log('Starting PaperCall.io events request...');
      
      // Validate parameters
      if (maxEvents && maxEvents > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Maximum events limit is 1000. Set maxEvents to null to get ALL events.'
        });
      }

      let events = [];
      let saveResult = null;

      // Use PaperCall scraper
      console.log('Using PaperCall.io scraper...');
      events = await paperCallScraperService.scrapePaperCallEvents({
        maxEvents: parseInt(maxEvents),
        headless: headless,
        delay: 1000
      });
      
      // Save to database if requested
      if (saveToDatabase && events.length > 0) {
        console.log('Saving events to database...');
        saveResult = await paperCallScraperService.saveEventsToDatabase(events, prisma);
      }
      // Transform events to match the required format
      const formattedEvents = events.map(event => ({
        title: cleanText(event.title) || 'No title available',
        eventUrl: event.eventUrl || 'https://www.papercall.io/pricing',
        description: cleanText(event.description) || 'No description available',
        dateTime: event.dateTime || null,
        tags: event.tags || ['Pro Event'],
        imageUrl: event.imageUrl || null,
        website: event.website || null,
        source: event.source || 'PaperCall.io',
        scrapedAt: event.scrapedAt || new Date().toISOString()
      }));

      res.status(200).json({
        success: true,
        message: `Successfully fetched ${formattedEvents.length} events from PaperCall.io`,
        data: {
          eventsFound: formattedEvents.length,
          allEvents: formattedEvents,
          saveResult: saveResult,
          method: 'PaperCall.io Scraping',
          scrapedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('PaperCall.io events fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch events from PaperCall.io',
        error: error.message
      });
    }
  }

  /**
   * Test PaperCall scraper functionality
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async testPaperCallScraper(req, res) {
    try {
      console.log('Testing PaperCall.io scraper functionality...');
      
      // Test with minimal parameters
      const events = await paperCallScraperService.scrapePaperCallEvents({
        maxEvents: 5,
        headless: true,
        delay: 500
      });

      // Transform events to match the required format
      const formattedEvents = events.map(event => ({
        title: cleanText(event.title) || 'No title available',
        eventUrl: event.eventUrl || 'https://www.papercall.io/pricing',
        description: cleanText(event.description) || 'No description available',
        dateTime: event.dateTime || null,
        tags: event.tags || ['Pro Event'],
        imageUrl: event.imageUrl || null,
        website: event.website || null,
        source: event.source || 'PaperCall.io',
        scrapedAt: event.scrapedAt || new Date().toISOString()
      }));

      res.status(200).json({
        success: true,
        message: 'PaperCall.io scraper test successful',
        data: {
          eventsFound: formattedEvents.length,
          allEvents: formattedEvents
        }
      });

    } catch (error) {
      console.error('PaperCall.io scraper test failed:', error);
      res.status(500).json({
        success: false,
        message: 'PaperCall.io scraper test failed',
        error: error.message
      });
    }
  }

  /**
   * Scrape events using Playwright with full pagination support
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async scrapeWithPlaywrightPagination(req, res) {
    try {
      const {
        maxEvents = null, // Set to null to get ALL events
        saveToDatabase = true,
        headless = true,
        delay = 2000,
        maxPages = 50,
        scrollToLoad = true
      } = req.body;

      console.log('🚀 Starting Playwright pagination scraper...');
      console.log(`📊 Target: ${maxEvents || 'ALL'} events, max pages: ${maxPages}`);
      
      // Validate parameters
      if (maxEvents && maxEvents > 5000) {
        return res.status(400).json({
          success: false,
          message: 'Maximum events limit is 5000. Set maxEvents to null to get ALL events.'
        });
      }

      let events = [];
      let saveResult = null;

      // Use Playwright pagination scraper
      console.log('🎭 Using Playwright pagination scraper...');
      events = await playwrightPaginationScraperService.scrapeWithPagination({
        maxEvents: maxEvents ? parseInt(maxEvents) : null,
        headless: headless,
        delay: parseInt(delay),
        maxPages: parseInt(maxPages),
        scrollToLoad: scrollToLoad
      });
      
      // Save to database if requested
      if (saveToDatabase && events.length > 0) {
        console.log('💾 Saving events to database...');
        saveResult = await playwrightPaginationScraperService.saveEventsToDatabase(events, prisma);
      }

      // Transform events to match the required format
      const formattedEvents = events.map(event => ({
        title: cleanText(event.title) || 'No title available',
        eventUrl: event.eventUrl || 'https://www.papercall.io/pricing',
        description: cleanText(event.description) || 'No description available',
        dateTime: event.dateTime || null,
        tags: event.tags || ['Pro Event'],
        imageUrl: event.imageUrl || null,
        website: event.website || null,
        source: event.source || 'PaperCall.io',
        scrapedAt: event.scrapedAt || new Date().toISOString(),
        location: event.location || null,
        eventType: event.eventType || null,
        cfpInfo: event.cfpInfo || null,
        contactEmail: event.contactEmail || null
      }));

      res.status(200).json({
        success: true,
        message: `Successfully scraped ${formattedEvents.length} events using Playwright pagination`,
        data: {
          eventsFound: formattedEvents.length,
          allEvents: formattedEvents,
          saveResult: saveResult,
          method: 'Playwright Pagination Scraping',
          scrapedAt: new Date().toISOString(),
          paginationInfo: {
            maxPages: maxPages,
            scrollToLoad: scrollToLoad,
            delay: delay
          }
        }
      });

    } catch (error) {
      console.error('❌ Playwright pagination scraping error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to scrape events with Playwright pagination',
        error: error.message
      });
    }
  }

  /**
   * Test Playwright pagination scraper functionality
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async testPlaywrightPaginationScraper(req, res) {
    try {
      console.log('🧪 Testing Playwright pagination scraper functionality...');
      
      // Get query parameters for customization
      const { maxEvents = null, maxPages = 14 } = req.query;
      
      // Test with configurable parameters
      const events = await playwrightPaginationScraperService.scrapeWithPagination({
        maxEvents: maxEvents ? parseInt(maxEvents) : null, // null = get ALL events
        headless: true,
        delay: 1000,
        maxPages: parseInt(maxPages),
        scrollToLoad: true
      });

      // Transform events to match the required format
      const formattedEvents = events.map(event => ({
        title: cleanText(event.title) || 'No title available',
        eventUrl: event.eventUrl || 'https://www.papercall.io/pricing',
        description: cleanText(event.description) || 'No description available',
        dateTime: event.dateTime || null,
        tags: event.tags || ['Pro Event'],
        imageUrl: event.imageUrl || null,
        website: event.website || null,
        source: event.source || 'PaperCall.io',
        scrapedAt: event.scrapedAt || new Date().toISOString(),
        location: event.location || null,
        eventType: event.eventType || null,
        cfpInfo: event.cfpInfo || null,
        contactEmail: event.contactEmail || null
      }));

      res.status(200).json({
        success: true,
        message: 'Playwright pagination scraper test successful',
        data: {
          eventsFound: formattedEvents.length,
          allEvents: formattedEvents,
          testTimestamp: new Date().toISOString(),
          testConfig: {
            maxEvents: maxEvents || 'ALL',
            maxPages: parseInt(maxPages),
            scrollToLoad: true
          }
        }
      });

    } catch (error) {
      console.error('❌ Playwright pagination scraper test failed:', error);
      res.status(500).json({
        success: false,
        message: 'Playwright pagination scraper test failed',
        error: error.message
      });
    }
  }

  /**
   * Get ALL events from PaperCall.io (no limits)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAllPaperCallEvents(req, res) {
    try {
      console.log('🚀 Getting ALL PaperCall.io events (no limits)...');
      
      // Scrape ALL events from ALL pages
      const events = await playwrightPaginationScraperService.scrapeWithPagination({
        maxEvents: null,        // null = get ALL events
        headless: true,
        delay: 2000,           // 2 second delay between pages
        maxPages: 14,          // All 14 pages
        scrollToLoad: true
      });

      // Transform events to match the required format
      const formattedEvents = events.map(event => ({
        title: cleanText(event.title) || 'No title available',
        eventUrl: event.eventUrl || 'https://www.papercall.io/pricing',
        description: cleanText(event.description) || 'No description available',
        dateTime: event.dateTime || null,
        tags: event.tags || ['Pro Event'],
        imageUrl: event.imageUrl || null,
        website: event.website || null,
        source: event.source || 'PaperCall.io',
        scrapedAt: event.scrapedAt || new Date().toISOString(),
        location: event.location || null,
        eventType: event.eventType || null,
        cfpInfo: event.cfpInfo || null,
        contactEmail: event.contactEmail || null
      }));

      res.status(200).json({
        success: true,
        message: `Successfully scraped ALL ${formattedEvents.length} events from PaperCall.io`,
        data: {
          eventsFound: formattedEvents.length,
          allEvents: formattedEvents,
          method: 'Playwright Pagination Scraping - ALL EVENTS',
          scrapedAt: new Date().toISOString(),
          paginationInfo: {
            totalPages: 14,
            eventsPerPage: Math.ceil(formattedEvents.length / 14),
            scrollToLoad: true,
            delay: 2000
          }
        }
      });

    } catch (error) {
      console.error('❌ Error getting all PaperCall.io events:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get all PaperCall.io events',
        error: error.message
      });
    }
  }

  /**
   * Scrape and save ALL 272 events to database
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async scrapeAndSaveAllEvents(req, res) {
    try {
      console.log('🚀 Scraping and saving ALL 272 events to database...');
      
      // Scrape ALL events from ALL pages
      const events = await playwrightPaginationScraperService.scrapeWithPagination({
        maxEvents: null,        // null = get ALL events
        headless: true,
        delay: 2000,           // 2 second delay between pages
        maxPages: 14,          // All 14 pages
        scrollToLoad: true
      });

      console.log(`📊 Scraped ${events.length} events, now saving to database...`);

      // Save all events to database
      const saveResult = await playwrightPaginationScraperService.saveEventsToDatabase(events, prisma);

      // Transform events to match the required format for response
      const formattedEvents = events.map(event => ({
        title: cleanText(event.title) || 'No title available',
        eventUrl: event.eventUrl || 'https://www.papercall.io/pricing',
        description: cleanText(event.description) || 'No description available',
        dateTime: event.dateTime || null,
        tags: event.tags || ['Pro Event'],
        imageUrl: event.imageUrl || null,
        website: event.website || null,
        source: event.source || 'PaperCall.io',
        scrapedAt: event.scrapedAt || new Date().toISOString(),
        location: event.location || null,
        eventType: event.eventType || null,
        cfpInfo: event.cfpInfo || null,
        contactEmail: event.contactEmail || null
      }));

      res.status(200).json({
        success: true,
        message: `Successfully scraped and saved ${saveResult.saved} events to database`,
        data: {
          eventsScraped: events.length,
          eventsSaved: saveResult.saved,
          eventsSkipped: saveResult.errors,
          allEvents: formattedEvents,
          saveResult: saveResult,
          method: 'Playwright Pagination Scraping + Database Save',
          scrapedAt: new Date().toISOString(),
          paginationInfo: {
            totalPages: 14,
            eventsPerPage: Math.ceil(events.length / 14),
            scrollToLoad: true,
            delay: 2000
          }
        }
      });

    } catch (error) {
      console.error('❌ Error scraping and saving events:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to scrape and save events to database',
        error: error.message
      });
    }
  }

  /**
   * Clean up old scraped events
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async cleanupOldEvents(req, res) {
    try {
      const { daysOld = 30 } = req.body;
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysOld));

      const deletedEvents = await prisma.event.deleteMany({
        where: {
          scrapedAt: {
            lt: cutoffDate
          }
        }
      });

      res.status(200).json({
        success: true,
        message: `Cleaned up ${deletedEvents.count} old events`,
        data: {
          deletedCount: deletedEvents.count,
          cutoffDate: cutoffDate.toISOString()
        }
      });

    } catch (error) {
      console.error('Error cleaning up old events:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clean up old events',
        error: error.message
      });
    }
  }
}

module.exports = new ScraperController();
