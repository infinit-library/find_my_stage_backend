const axios = require('axios');
const cheerio = require('cheerio');

class EventbriteSimpleScraperService {
  constructor() {
    this.baseUrl = 'https://www.eventbrite.com';
    this.laEventsUrl = 'https://www.eventbrite.com/d/ca--los-angeles/events/';
  }

  /**
   * Scrape events from Eventbrite Los Angeles page using simple HTTP request
   * @param {Object} options - Scraping options
   * @param {number} options.maxEvents - Maximum number of events to scrape
   * @returns {Array} Array of event objects
   */
  async scrapeLosAngelesEvents(options = {}) {
    const { maxEvents = 50 } = options;

    try {
      console.log('Starting simple Eventbrite scraper...');
      
      // Make HTTP request to get the page
      const response = await axios.get(this.laEventsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 30000
      });

      console.log('Page loaded, parsing content...');
      
      // Parse with Cheerio
      const $ = cheerio.load(response.data);
      
      // Try to find events using multiple strategies
      const events = this.parseEvents($, maxEvents);
      
      console.log(`Successfully scraped ${events.length} events`);
      return events;

    } catch (error) {
      console.error('Error scraping Eventbrite:', error);
      throw new Error(`Scraping failed: ${error.message}`);
    }
  }

  /**
   * Parse events from HTML content
   * @param {Object} $ - Cheerio instance
   * @param {number} maxEvents - Maximum events to parse
   * @returns {Array} Array of parsed event objects
   */
  parseEvents($, maxEvents) {
    const events = [];
    
    console.log('Parsing events from HTML...');
    
    // Strategy 1: Look for structured data in script tags
    const structuredEvents = this.extractStructuredData($);
    events.push(...structuredEvents);
    
    // Strategy 2: Look for event cards in the HTML
    if (events.length === 0) {
      const cardEvents = this.extractEventCards($, maxEvents);
      events.push(...cardEvents);
    }
    
    // Strategy 3: Look for any text that might be event information
    if (events.length === 0) {
      const textEvents = this.extractEventText($, maxEvents);
      events.push(...textEvents);
    }
    
    return events.slice(0, maxEvents);
  }

  /**
   * Extract events from structured data (JSON-LD, microdata, etc.)
   * @param {Object} $ - Cheerio instance
   * @returns {Array} Array of event objects
   */
  extractStructuredData($) {
    const events = [];
    
    // Look for JSON-LD structured data
    $('script[type="application/ld+json"]').each((index, element) => {
      try {
        const data = JSON.parse($(element).html());
        if (data['@type'] === 'Event' || (Array.isArray(data) && data.some(item => item['@type'] === 'Event'))) {
          const eventData = Array.isArray(data) ? data : [data];
          eventData.forEach(event => {
            if (event['@type'] === 'Event') {
              events.push({
                title: event.name,
                description: event.description,
                dateTime: event.startDate,
                location: event.location?.name || event.location?.address,
                price: event.offers?.price,
                imageUrl: event.image,
                eventUrl: event.url,
                source: 'Eventbrite',
                scrapedAt: new Date().toISOString(),
                city: 'Los Angeles',
                state: 'CA',
                country: 'USA'
              });
            }
          });
        }
      } catch (e) {
        // Skip invalid JSON
      }
    });
    
    return events;
  }

  /**
   * Extract events from event cards in HTML
   * @param {Object} $ - Cheerio instance
   * @param {number} maxEvents - Maximum events to extract
   * @returns {Array} Array of event objects
   */
  extractEventCards($, maxEvents) {
    const events = [];
    
    // Try different selectors for event cards
    const selectors = [
      '[data-testid*="event"]',
      '[class*="event"]',
      '[class*="card"]',
      '[class*="tile"]',
      'article',
      'div[role="article"]'
    ];
    
    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`Found ${elements.length} elements with selector: ${selector}`);
        
        elements.slice(0, maxEvents).each((index, element) => {
          const $el = $(element);
          const event = this.parseEventElement($, $el);
          if (event && event.title) {
            events.push(event);
          }
        });
        
        if (events.length > 0) {
          break; // Stop after finding events with one selector
        }
      }
    }
    
    return events;
  }

  /**
   * Extract events from text patterns
   * @param {Object} $ - Cheerio instance
   * @param {number} maxEvents - Maximum events to extract
   * @returns {Array} Array of event objects
   */
  extractEventText($, maxEvents) {
    const events = [];
    const bodyText = $('body').text();
    
    // Look for patterns that might indicate events
    const eventPatterns = [
      /(\w+day)\s*[•·]\s*(\d+):(\d+)\s*(AM|PM)/gi, // "Friday • 10:00 PM"
      /(\w+)\s+(\d+)\s*[•·]\s*(\d+):(\d+)\s*(AM|PM)/gi, // "Sep 14 • 9:00 PM"
      /(\w+)\s+(\d+)\s*[•·]\s*(\d+):(\d+)\s*(AM|PM)/gi // "Sep 20 • 10:30 AM"
    ];
    
    const matches = [];
    eventPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(bodyText)) !== null && matches.length < maxEvents) {
        matches.push({
          dateTime: match[0],
          index: match.index
        });
      }
    });
    
    // Try to extract context around each match
    matches.forEach(match => {
      const start = Math.max(0, match.index - 200);
      const end = Math.min(bodyText.length, match.index + 200);
      const context = bodyText.substring(start, end);
      
      // Try to extract event information from context
      const lines = context.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      const event = {
        title: this.findTitleInContext(lines),
        dateTime: match.dateTime,
        location: this.findLocationInContext(lines),
        source: 'Eventbrite',
        scrapedAt: new Date().toISOString(),
        city: 'Los Angeles',
        state: 'CA',
        country: 'USA'
      };
      
      if (event.title) {
        events.push(event);
      }
    });
    
    return events.slice(0, maxEvents);
  }

  /**
   * Parse individual event element
   * @param {Object} $ - Cheerio instance
   * @param {Object} $el - Event element
   * @returns {Object} Parsed event object
   */
  parseEventElement($, $el) {
    const event = {};

    // Extract title
    const titleSelectors = ['h1', 'h2', 'h3', 'h4', 'a', '[class*="title"]'];
    for (const selector of titleSelectors) {
      const titleText = $el.find(selector).first().text().trim();
      if (titleText && titleText.length > 3) {
        event.title = titleText;
        break;
      }
    }
    
    // Extract date/time
    const dateSelectors = ['time', '[class*="date"]', '[class*="time"]'];
    for (const selector of dateSelectors) {
      const dateText = $el.find(selector).first().text().trim();
      if (dateText) {
        event.dateTime = dateText;
        break;
      }
    }
    
    // Extract location
    const locationSelectors = ['[class*="location"]', '[class*="venue"]', 'address'];
    for (const selector of locationSelectors) {
      const locationText = $el.find(selector).first().text().trim();
      if (locationText) {
        event.location = locationText;
        break;
      }
    }
    
    // Extract price
    const priceSelectors = ['[class*="price"]', '[class*="cost"]', '[class*="ticket"]'];
    for (const selector of priceSelectors) {
      const priceText = $el.find(selector).first().text().trim();
      if (priceText) {
        event.price = priceText;
        break;
      }
    }
    
    // Extract image
    const imgEl = $el.find('img').first();
    if (imgEl.length) {
      event.imageUrl = imgEl.attr('src') || imgEl.attr('data-src');
    }
    
    // Extract link
    const linkEl = $el.find('a').first();
    if (linkEl.length) {
      event.eventUrl = linkEl.attr('href');
      if (event.eventUrl && !event.eventUrl.startsWith('http')) {
        event.eventUrl = this.baseUrl + event.eventUrl;
      }
    }
    
    // Add metadata
    event.source = 'Eventbrite';
    event.scrapedAt = new Date().toISOString();
    event.city = 'Los Angeles';
    event.state = 'CA';
    event.country = 'USA';

    return event;
  }

  /**
   * Find title in context lines
   * @param {Array} lines - Context lines
   * @returns {string} Title or null
   */
  findTitleInContext(lines) {
    // Look for longer lines that might be titles
    const titleCandidates = lines.filter(line => line.length > 10 && line.length < 100);
    return titleCandidates.length > 0 ? titleCandidates[0] : null;
  }

  /**
   * Find location in context lines
   * @param {Array} lines - Context lines
   * @returns {string} Location or null
   */
  findLocationInContext(lines) {
    // Look for location-like text
    const locationCandidates = lines.filter(line => 
      line.includes('Los Angeles') || 
      line.includes('CA') || 
      line.includes('venue') ||
      line.includes('theater') ||
      line.includes('center')
    );
    return locationCandidates.length > 0 ? locationCandidates[0] : null;
  }

  /**
   * Save events to database
   * @param {Array} events - Array of event objects
   * @param {Object} db - Database connection
   * @returns {Object} Save result
   */
  async saveEventsToDatabase(events, db) {
    try {
      const savedEvents = [];
      const errors = [];

      for (const event of events) {
        try {
          // Check if event already exists
          const existingEvent = await db.event.findFirst({
            where: {
              title: event.title,
              dateTime: event.dateTime,
              location: event.location
            }
          });

          if (existingEvent) {
            console.log(`Event already exists: ${event.title}`);
            continue;
          }

          // Create new event
          const newEvent = await db.event.create({
            data: {
              title: event.title,
              description: event.description,
              dateTime: event.dateTime,
              location: event.location,
              venue: event.venue,
              price: event.price ? parseFloat(event.price.replace(/[^0-9.]/g, '')) : 0,
              priceDisplay: event.price,
              imageUrl: event.imageUrl,
              eventUrl: event.eventUrl,
              category: event.category,
              source: 'Eventbrite',
              city: 'Los Angeles',
              state: 'CA',
              country: 'USA',
              scrapedAt: new Date(),
              metadata: {
                extractedMethod: 'simple',
                originalData: event
              }
            }
          });

          savedEvents.push(newEvent);
          console.log(`Saved event: ${event.title}`);
        } catch (error) {
          console.error(`Error saving event ${event.title}:`, error);
          errors.push({ event: event.title, error: error.message });
        }
      }

      return {
        saved: savedEvents.length,
        errors: errors.length,
        savedEvents,
        errors
      };
    } catch (error) {
      console.error('Error saving events to database:', error);
      throw error;
    }
  }
}

module.exports = EventbriteSimpleScraperService;
