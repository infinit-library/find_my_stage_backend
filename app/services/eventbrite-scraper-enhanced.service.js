const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');

class EventbriteScraperEnhancedService {
  constructor() {
    this.baseUrl = 'https://www.eventbrite.com';
    this.laEventsUrl = 'https://www.eventbrite.com/d/ca--los-angeles/events/';
  }

  /**
   * Scrape events from Eventbrite Los Angeles page with enhanced detection
   * @param {Object} options - Scraping options
   * @param {number} options.maxEvents - Maximum number of events to scrape
   * @param {boolean} options.headless - Run browser in headless mode
   * @param {number} options.delay - Delay between requests in ms
   * @returns {Array} Array of event objects
   */
  async scrapeLosAngelesEvents(options = {}) {
    const {
      maxEvents = 50,
      headless = true,
      delay = 1000
    } = options;

    let browser;
    try {
      console.log('Starting enhanced Eventbrite scraper...');
      
      // Launch browser with more options
      browser = await puppeteer.launch({
        headless: headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });

      const page = await browser.newPage();
      
      // Set user agent to avoid detection
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Set viewport
      await page.setViewport({ width: 1920, height: 1080 });

      // Block unnecessary resources to speed up loading
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
          req.abort();
        } else {
          req.continue();
        }
      });

      console.log('Navigating to Eventbrite LA events page...');
      await page.goto(this.laEventsUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });

      // Wait for page to load and try to find events
      console.log('Waiting for page to load...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Try to find events using multiple strategies
      const events = await this.findEventsOnPage(page, maxEvents);
      
      console.log(`Successfully scraped ${events.length} events`);
      return events;

    } catch (error) {
      console.error('Error scraping Eventbrite:', error);
      throw new Error(`Scraping failed: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Find events on the page using multiple strategies
   * @param {Object} page - Puppeteer page object
   * @param {number} maxEvents - Maximum events to find
   * @returns {Array} Array of event objects
   */
  async findEventsOnPage(page, maxEvents) {
    const events = [];

    // Strategy 1: Look for common event patterns in the DOM
    console.log('Strategy 1: Searching for event patterns...');
    const domEvents = await this.extractEventsFromDOM(page, maxEvents);
    events.push(...domEvents);

    // Strategy 2: Look for JSON-LD structured data
    if (events.length === 0) {
      console.log('Strategy 2: Searching for JSON-LD structured data...');
      const jsonEvents = await this.extractEventsFromJSONLD(page);
      events.push(...jsonEvents);
    }

    // Strategy 3: Look for API calls or embedded data
    if (events.length === 0) {
      console.log('Strategy 3: Searching for embedded data...');
      const embeddedEvents = await this.extractEventsFromEmbeddedData(page);
      events.push(...embeddedEvents);
    }

    // Strategy 4: Try to find any text that looks like event information
    if (events.length === 0) {
      console.log('Strategy 4: Searching for event-like text patterns...');
      const textEvents = await this.extractEventsFromTextPatterns(page, maxEvents);
      events.push(...textEvents);
    }

    return events.slice(0, maxEvents);
  }

  /**
   * Extract events from DOM elements
   * @param {Object} page - Puppeteer page object
   * @param {number} maxEvents - Maximum events to extract
   * @returns {Array} Array of event objects
   */
  async extractEventsFromDOM(page, maxEvents) {
    try {
      const events = await page.evaluate((maxEvents) => {
        const eventElements = [];
        
        // Try to find elements that might contain event information
        const selectors = [
          '[data-testid*="event"]',
          '[class*="event"]',
          '[class*="card"]',
          '[class*="tile"]',
          '[class*="item"]',
          'article',
          'div[role="article"]',
          'div[role="listitem"]'
        ];

        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            console.log(`Found ${elements.length} elements with selector: ${selector}`);
            
            elements.forEach((element, index) => {
              if (index >= maxEvents) return;
              
              const event = {};
              
              // Try to extract title
              const titleSelectors = ['h1', 'h2', 'h3', 'h4', 'a', '[class*="title"]'];
              for (const titleSelector of titleSelectors) {
                const titleEl = element.querySelector(titleSelector);
                if (titleEl && titleEl.textContent.trim().length > 3) {
                  event.title = titleEl.textContent.trim();
                  break;
                }
              }
              
              // Try to extract date/time
              const dateSelectors = ['time', '[class*="date"]', '[class*="time"]'];
              for (const dateSelector of dateSelectors) {
                const dateEl = element.querySelector(dateSelector);
                if (dateEl && dateEl.textContent.trim()) {
                  event.dateTime = dateEl.textContent.trim();
                  break;
                }
              }
              
              // Try to extract location
              const locationSelectors = ['[class*="location"]', '[class*="venue"]', 'address'];
              for (const locationSelector of locationSelectors) {
                const locationEl = element.querySelector(locationSelector);
                if (locationEl && locationEl.textContent.trim()) {
                  event.location = locationEl.textContent.trim();
                  break;
                }
              }
              
              // Try to extract price
              const priceSelectors = ['[class*="price"]', '[class*="cost"]', '[class*="ticket"]'];
              for (const priceSelector of priceSelectors) {
                const priceEl = element.querySelector(priceSelector);
                if (priceEl && priceEl.textContent.trim()) {
                  event.price = priceEl.textContent.trim();
                  break;
                }
              }
              
              // Try to extract image
              const imgEl = element.querySelector('img');
              if (imgEl) {
                event.imageUrl = imgEl.src || imgEl.getAttribute('data-src');
              }
              
              // Try to extract link
              const linkEl = element.querySelector('a');
              if (linkEl) {
                event.eventUrl = linkEl.href;
              }
              
              // Only add if we have at least a title
              if (event.title) {
                eventElements.push(event);
              }
            });
            
            if (eventElements.length > 0) {
              break; // Stop after finding events with one selector
            }
          }
        }
        
        return eventElements;
      }, maxEvents);

      return events;
    } catch (error) {
      console.error('Error extracting events from DOM:', error);
      return [];
    }
  }

  /**
   * Extract events from JSON-LD structured data
   * @param {Object} page - Puppeteer page object
   * @returns {Array} Array of event objects
   */
  async extractEventsFromJSONLD(page) {
    try {
      const events = await page.evaluate(() => {
        const events = [];
        const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
        
        jsonLdScripts.forEach(script => {
          try {
            const data = JSON.parse(script.textContent);
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
                    eventUrl: event.url
                  });
                }
              });
            }
          } catch (e) {
            // Skip invalid JSON
          }
        });
        
        return events;
      });

      return events;
    } catch (error) {
      console.error('Error extracting events from JSON-LD:', error);
      return [];
    }
  }

  /**
   * Extract events from embedded data (window.__INITIAL_STATE__ etc.)
   * @param {Object} page - Puppeteer page object
   * @returns {Array} Array of event objects
   */
  async extractEventsFromEmbeddedData(page) {
    try {
      const events = await page.evaluate(() => {
        const events = [];
        
        // Look for common global variables that might contain event data
        const globalVars = [
          'window.__INITIAL_STATE__',
          'window.__APOLLO_STATE__',
          'window.__NEXT_DATA__',
          'window.__NUXT__',
          'window.__DATA__',
          'window.initialData',
          'window.eventData'
        ];
        
        for (const varName of globalVars) {
          try {
            const data = eval(varName);
            if (data && typeof data === 'object') {
              // Try to find event-like data in the object
              const eventData = this.findEventDataInObject(data);
              if (eventData.length > 0) {
                events.push(...eventData);
              }
            }
          } catch (e) {
            // Variable doesn't exist or is not accessible
          }
        }
        
        return events;
      });

      return events;
    } catch (error) {
      console.error('Error extracting events from embedded data:', error);
      return [];
    }
  }

  /**
   * Extract events from text patterns
   * @param {Object} page - Puppeteer page object
   * @param {number} maxEvents - Maximum events to extract
   * @returns {Array} Array of event objects
   */
  async extractEventsFromTextPatterns(page, maxEvents) {
    try {
      const events = await page.evaluate((maxEvents) => {
        const events = [];
        const bodyText = document.body.textContent;
        
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
            dateTime: match.dateTime
          };
          
          // Look for title-like text (longer lines that might be titles)
          const titleCandidates = lines.filter(line => line.length > 10 && line.length < 100);
          if (titleCandidates.length > 0) {
            event.title = titleCandidates[0];
          }
          
          // Look for location-like text
          const locationCandidates = lines.filter(line => 
            line.includes('Los Angeles') || 
            line.includes('CA') || 
            line.includes('venue') ||
            line.includes('theater') ||
            line.includes('center')
          );
          if (locationCandidates.length > 0) {
            event.location = locationCandidates[0];
          }
          
          if (event.title) {
            events.push(event);
          }
        });
        
        return events.slice(0, maxEvents);
      }, maxEvents);

      return events;
    } catch (error) {
      console.error('Error extracting events from text patterns:', error);
      return [];
    }
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
                extractedMethod: 'enhanced',
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

module.exports = EventbriteScraperEnhancedService;
