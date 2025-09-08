const EventbriteScraperService = require('../services/eventbrite-scraper.service');
const EventbriteApiService = require('../services/eventbrite-api.service');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const scraperService = new EventbriteScraperService();
const apiService = new EventbriteApiService(process.env.EVENTBRITE_API_KEY);

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
