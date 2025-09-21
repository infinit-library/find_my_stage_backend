const axios = require('axios');
const cheerio = require('cheerio');

class EventbriteSimpleScraperService {
  constructor() {
    this.baseUrl = 'https://www.eventbrite.com';
    this.laEventsUrl = 'https://www.eventbrite.com/d/ca--los-angeles/events/';
  }

  async scrapeLosAngelesEvents(options = {}) {
    const { maxEvents = 50 } = options;

    try {
      console.log('Starting simple Eventbrite scraper...');
      
     
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
      
     
      const $ = cheerio.load(response.data);
      
     
      const events = this.parseEvents($, maxEvents);
      
      console.log(`Successfully scraped ${events.length} events`);
      return events;

    } catch (error) {
      console.error('Error scraping Eventbrite:', error);
      throw new Error(`Scraping failed: ${error.message}`);
    }
  }

  parseEvents($, maxEvents) {
    const events = [];
    
    console.log('Parsing events from HTML...');
    
   
    const structuredEvents = this.extractStructuredData($);
    events.push(...structuredEvents);
    
   
    if (events.length === 0) {
      const cardEvents = this.extractEventCards($, maxEvents);
      events.push(...cardEvents);
    }
    
   
    if (events.length === 0) {
      const textEvents = this.extractEventText($, maxEvents);
      events.push(...textEvents);
    }
    
    return events.slice(0, maxEvents);
  }

  extractStructuredData($) {
    const events = [];
    
   
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
       
      }
    });
    
    return events;
  }

  extractEventCards($, maxEvents) {
    const events = [];
    
   
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
          break;
        }
      }
    }
    
    return events;
  }

  extractEventText($, maxEvents) {
    const events = [];
    const bodyText = $('body').text();
    
   
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

  parseEventElement($, $el) {
    const event = {};

   
    const titleSelectors = ['h1', 'h2', 'h3', 'h4', 'a', '[class*="title"]'];
    for (const selector of titleSelectors) {
      const titleText = $el.find(selector).first().text().trim();
      if (titleText && titleText.length > 3) {
        event.title = titleText;
        break;
      }
    }
    
   
    const dateSelectors = ['time', '[class*="date"]', '[class*="time"]'];
    for (const selector of dateSelectors) {
      const dateText = $el.find(selector).first().text().trim();
      if (dateText) {
        event.dateTime = dateText;
        break;
      }
    }
    
   
    const locationSelectors = ['[class*="location"]', '[class*="venue"]', 'address'];
    for (const selector of locationSelectors) {
      const locationText = $el.find(selector).first().text().trim();
      if (locationText) {
        event.location = locationText;
        break;
      }
    }
    
   
    const priceSelectors = ['[class*="price"]', '[class*="cost"]', '[class*="ticket"]'];
    for (const selector of priceSelectors) {
      const priceText = $el.find(selector).first().text().trim();
      if (priceText) {
        event.price = priceText;
        break;
      }
    }
    
   
    const imgEl = $el.find('img').first();
    if (imgEl.length) {
      event.imageUrl = imgEl.attr('src') || imgEl.attr('data-src');
    }
    
   
    const linkEl = $el.find('a').first();
    if (linkEl.length) {
      event.eventUrl = linkEl.attr('href');
      if (event.eventUrl && !event.eventUrl.startsWith('http')) {
        event.eventUrl = this.baseUrl + event.eventUrl;
      }
    }
    
   
    event.source = 'Eventbrite';
    event.scrapedAt = new Date().toISOString();
    event.city = 'Los Angeles';
    event.state = 'CA';
    event.country = 'USA';

    return event;
  }

  findTitleInContext(lines) {
   
    const titleCandidates = lines.filter(line => line.length > 10 && line.length < 100);
    return titleCandidates.length > 0 ? titleCandidates[0] : null;
  }

  findLocationInContext(lines) {
   
    const locationCandidates = lines.filter(line => 
      line.includes('Los Angeles') || 
      line.includes('CA') || 
      line.includes('venue') ||
      line.includes('theater') ||
      line.includes('center')
    );
    return locationCandidates.length > 0 ? locationCandidates[0] : null;
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
