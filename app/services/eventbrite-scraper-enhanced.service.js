const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');

class EventbriteScraperEnhancedService {
  constructor() {
    this.baseUrl = 'https://www.eventbrite.com';
    this.laEventsUrl = 'https://www.eventbrite.com/d/ca--los-angeles/events/';
  }

  async scrapeLosAngelesEvents(options = {}) {
    const {
      maxEvents = 50,
      headless = true,
      delay = 1000
    } = options;

    let browser;
    try {
      console.log('Starting enhanced Eventbrite scraper...');
      
      
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
      
      
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      
      await page.setViewport({ width: 1920, height: 1080 });

      
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

      
      console.log('Waiting for page to load...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      
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

  async findEventsOnPage(page, maxEvents) {
    const events = [];

    
    console.log('Strategy 1: Searching for event patterns...');
    const domEvents = await this.extractEventsFromDOM(page, maxEvents);
    events.push(...domEvents);

    
    if (events.length === 0) {
      console.log('Strategy 2: Searching for JSON-LD structured data...');
      const jsonEvents = await this.extractEventsFromJSONLD(page);
      events.push(...jsonEvents);
    }

    
    if (events.length === 0) {
      console.log('Strategy 3: Searching for embedded data...');
      const embeddedEvents = await this.extractEventsFromEmbeddedData(page);
      events.push(...embeddedEvents);
    }

    
    if (events.length === 0) {
      console.log('Strategy 4: Searching for event-like text patterns...');
      const textEvents = await this.extractEventsFromTextPatterns(page, maxEvents);
      events.push(...textEvents);
    }

    return events.slice(0, maxEvents);
  }

  async extractEventsFromDOM(page, maxEvents) {
    try {
      const events = await page.evaluate((maxEvents) => {
        const eventElements = [];
        
        
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
              
              
              const titleSelectors = ['h1', 'h2', 'h3', 'h4', 'a', '[class*="title"]'];
              for (const titleSelector of titleSelectors) {
                const titleEl = element.querySelector(titleSelector);
                if (titleEl && titleEl.textContent.trim().length > 3) {
                  event.title = titleEl.textContent.trim();
                  break;
                }
              }
              
              
              const dateSelectors = ['time', '[class*="date"]', '[class*="time"]'];
              for (const dateSelector of dateSelectors) {
                const dateEl = element.querySelector(dateSelector);
                if (dateEl && dateEl.textContent.trim()) {
                  event.dateTime = dateEl.textContent.trim();
                  break;
                }
              }
              
              
              const locationSelectors = ['[class*="location"]', '[class*="venue"]', 'address'];
              for (const locationSelector of locationSelectors) {
                const locationEl = element.querySelector(locationSelector);
                if (locationEl && locationEl.textContent.trim()) {
                  event.location = locationEl.textContent.trim();
                  break;
                }
              }
              
              
              const priceSelectors = ['[class*="price"]', '[class*="cost"]', '[class*="ticket"]'];
              for (const priceSelector of priceSelectors) {
                const priceEl = element.querySelector(priceSelector);
                if (priceEl && priceEl.textContent.trim()) {
                  event.price = priceEl.textContent.trim();
                  break;
                }
              }
              
              
              const imgEl = element.querySelector('img');
              if (imgEl) {
                event.imageUrl = imgEl.src || imgEl.getAttribute('data-src');
              }
              
              
              const linkEl = element.querySelector('a');
              if (linkEl) {
                event.eventUrl = linkEl.href;
              }
              
              
              if (event.title) {
                eventElements.push(event);
              }
            });
            
            if (eventElements.length > 0) {
              break; 
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

  async extractEventsFromEmbeddedData(page) {
    try {
      const events = await page.evaluate(() => {
        const events = [];
        
        
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
              
              const eventData = this.findEventDataInObject(data);
              if (eventData.length > 0) {
                events.push(...eventData);
              }
            }
          } catch (e) {
            
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

  async extractEventsFromTextPatterns(page, maxEvents) {
    try {
      const events = await page.evaluate((maxEvents) => {
        const events = [];
        const bodyText = document.body.textContent;
        
        
        const eventPatterns = [
          /(\w+day)\s*[•·]\s*(\d+):(\d+)\s*(AM|PM)/gi, 
          /(\w+)\s+(\d+)\s*[•·]\s*(\d+):(\d+)\s*(AM|PM)/gi, 
          /(\w+)\s+(\d+)\s*[•·]\s*(\d+):(\d+)\s*(AM|PM)/gi 
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
        
        
        matches.forEach(match => {
          const start = Math.max(0, match.index - 200);
          const end = Math.min(bodyText.length, match.index + 200);
          const context = bodyText.substring(start, end);
          
          
          const lines = context.split('\n').map(line => line.trim()).filter(line => line.length > 0);
          
          const event = {
            dateTime: match.dateTime
          };
          
          
          const titleCandidates = lines.filter(line => line.length > 10 && line.length < 100);
          if (titleCandidates.length > 0) {
            event.title = titleCandidates[0];
          }
          
          
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

  async saveEventsToDatabase(events, db) {
    try {
      const savedEvents = [];
      const errors = [];

      for (const event of events) {
        try {
          
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
