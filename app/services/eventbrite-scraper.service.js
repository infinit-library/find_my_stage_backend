const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');

class EventbriteScraperService {
    constructor() {
        this.baseUrl = 'https://www.eventbrite.com';
        this.laEventsUrl = 'https://www.eventbrite.com/d/ca--los-angeles/events/';
    }

    /**
     * Scrape events from Eventbrite Los Angeles page
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
            console.log('Starting Eventbrite scraper...');

            // Launch browser
            browser = await puppeteer.launch({
                headless: headless,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            });

            const page = await browser.newPage();

            // Set user agent to avoid detection
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

            // Set viewport
            await page.setViewport({ width: 1920, height: 1080 });

            console.log('Navigating to Eventbrite LA events page...');
            await page.goto(this.laEventsUrl, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            // Wait for events to load using modern locator syntax
            const eventSelectors = [
                '.eds-g-cell',
                '.discover-vertical-event-card',
                '.event-card',
                '[data-testid="event-card"]',
                '.eds-g-cell-3-12',
                '.eds-g-cell--has-overflow',
                '.eds-l-pad-all-3'
            ];

            let eventsLoaded = false;
            for (const selector of eventSelectors) {
                try {
                    const locator = page.locator(selector);
                    await locator.waitHandle({ timeout: 5000 });
                    console.log(`Found events with selector: ${selector}`);
                    eventsLoaded = true;
                    break;
                } catch (error) {
                    console.log(`Selector ${selector} not found, trying next...`);
                }
            }

            if (!eventsLoaded) {
                // Try to wait for any content that might contain events
                const bodyLocator = page.locator('body');
                await bodyLocator.waitHandle({ timeout: 5000 });
                console.log('Waiting for page content to load...');
                await new Promise(resolve => setTimeout(resolve, 3000));
            }

            // Scroll to load more events
            await this.scrollToLoadEvents(page, maxEvents);

            // Get page content
            const content = await page.content();

            // Parse with Cheerio
            const $ = cheerio.load(content);

            const events = this.parseEvents($, maxEvents);

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
     * Scroll page to load more events
     * @param {Object} page - Puppeteer page object
     * @param {number} maxEvents - Maximum events to load
     */
    async scrollToLoadEvents(page, maxEvents) {
        let previousHeight = 0;
        let currentHeight = await page.evaluate('document.body.scrollHeight');
        let scrollAttempts = 0;
        const maxScrollAttempts = 5;

        // Try different selectors to count events based on actual HTML structure
        const eventSelectors = [
            '.eds-g-cell',
            '.discover-vertical-event-card',
            '.event-card',
            '[data-testid="event-card"]',
            '.eds-g-cell-3-12',
            '.eds-g-cell--has-overflow',
            '.eds-l-pad-all-3',
            'article[data-testid*="event"]',
            'div[data-testid*="event"]'
        ];

        while (currentHeight > previousHeight && scrollAttempts < maxScrollAttempts) {
            // Check if we have enough events using any available selector
            let eventCount = 0;
            for (const selector of eventSelectors) {
                try {
                    eventCount = await page.$$eval(selector, elements => elements.length);
                    if (eventCount > 0) {
                        console.log(`Found ${eventCount} events with selector: ${selector}`);
                        break;
                    }
                } catch (error) {
                    // Continue to next selector
                }
            }

            if (eventCount >= maxEvents) {
                console.log(`Reached target of ${maxEvents} events`);
                break;
            }

            // Scroll to bottom
            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');

            // Wait for new content to load
            await new Promise(resolve => setTimeout(resolve, 2000));

            previousHeight = currentHeight;
            currentHeight = await page.evaluate('document.body.scrollHeight');
            scrollAttempts++;
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

        // Try different selectors to find event cards based on actual HTML structure
        const eventSelectors = [
            '.eds-g-cell',
            '.discover-vertical-event-card',
            '.event-card',
            '[data-testid="event-card"]',
            '.eds-g-cell-3-12',
            '.eds-g-cell--has-overflow',
            '.eds-l-pad-all-3',
            'article[data-testid*="event"]',
            'div[data-testid*="event"]'
        ];

        let eventElements = null;
        let usedSelector = null;

        // Find the first selector that returns elements
        for (const selector of eventSelectors) {
            const elements = $(selector);
            if (elements.length > 0) {
                eventElements = elements;
                usedSelector = selector;
                console.log(`Using selector: ${selector} (found ${elements.length} elements)`);
                break;
            }
        }

        if (!eventElements || eventElements.length === 0) {
            console.log('No event elements found with any selector');
            // Try to find any elements that might contain event information
            const fallbackSelectors = [
                'div[class*="card"]',
                'article',
                'div[class*="tile"]',
                'div[class*="item"]'
            ];

            for (const selector of fallbackSelectors) {
                const elements = $(selector);
                if (elements.length > 0) {
                    console.log(`Trying fallback selector: ${selector} (found ${elements.length} elements)`);
                    eventElements = elements;
                    usedSelector = selector;
                    break;
                }
            }
        }

        if (eventElements && eventElements.length > 0) {
            eventElements.slice(0, maxEvents).each((index, element) => {
                try {
                    const event = this.parseEventCard($, $(element));
                    if (event && event.title) {
                        events.push(event);
                    }
                } catch (error) {
                    console.warn(`Error parsing event ${index}:`, error.message);
                }
            });
        } else {
            console.log('No event elements found. Page structure may have changed.');
        }

        return events;
    }

    /**
     * Parse individual event card
     * @param {Object} $ - Cheerio instance
     * @param {Object} $card - Event card element
     * @returns {Object} Parsed event object
     */
    parseEventCard($, $card) {
        const event = {};

        // Extract title - try multiple selectors based on actual HTML structure
        const titleSelectors = [
            'h3.event-card__clamp-line--two',
            'h3.Typography_root__487rx',
            'h1', 'h2', 'h3', 'h4',
            '[data-testid="event-title"]',
            '.event-title',
            '.title',
            '[class*="title"]',
            'a[href*="/e/"]'
        ];

        for (const selector of titleSelectors) {
            const titleText = $card.find(selector).first().text().trim();
            if (titleText && titleText.length > 3) {
                event.title = titleText;
                break;
            }
        }

        // If no title found, try to get text from the first link
        if (!event.title) {
            const linkText = $card.find('a').first().text().trim();
            if (linkText && linkText.length > 3) {
                event.title = linkText;
            }
        }

        // Extract date and time - try multiple selectors based on actual HTML structure
        const dateSelectors = [
            'p.Typography_body-md-bold__487rx',
            '[data-testid="event-date"]',
            '.event-date',
            '.date',
            '[class*="date"]',
            'time',
            '[datetime]'
        ];

        let dateTimeText = '';
        for (const selector of dateSelectors) {
            dateTimeText = $card.find(selector).first().text().trim();
            if (dateTimeText) break;
        }
        event.dateTime = this.parseDateTime(dateTimeText);

        // Extract location - try multiple selectors based on actual HTML structure
        const locationSelectors = [
            'p.event-card__clamp-line--one',
            'p.Typography_body-md__487rx',
            '[data-testid="event-location"]',
            '.event-location',
            '.location',
            '[class*="location"]',
            '[class*="venue"]',
            'address'
        ];

        for (const selector of locationSelectors) {
            const locationText = $card.find(selector).first().text().trim();
            if (locationText) {
                event.location = locationText;
                break;
            }
        }

        // Extract venue
        const venueSelectors = [
            '[data-testid="event-venue"]',
            '.event-venue',
            '.venue',
            '[class*="venue"]'
        ];

        for (const selector of venueSelectors) {
            const venueText = $card.find(selector).first().text().trim();
            if (venueText) {
                event.venue = venueText;
                break;
            }
        }

        // Extract price - try multiple selectors based on actual HTML structure
        const priceSelectors = [
            'div.DiscoverVerticalEventCard-module__priceWrapper___usWo6 p',
            'p:contains("From $")',
            '[data-testid="event-price"]',
            '.event-price',
            '.price',
            '[class*="price"]',
            '[class*="cost"]',
            '[class*="ticket"]'
        ];

        let priceText = '';
        for (const selector of priceSelectors) {
            priceText = $card.find(selector).first().text().trim();
            if (priceText) break;
        }
        event.price = this.parsePrice(priceText);

        // Extract image URL
        const imgElement = $card.find('img').first();
        event.imageUrl = imgElement.attr('src') || imgElement.attr('data-src') || imgElement.attr('data-lazy');

        // Extract event URL
        const linkElement = $card.find('a').first();
        event.eventUrl = linkElement.attr('href');
        if (event.eventUrl && !event.eventUrl.startsWith('http')) {
            event.eventUrl = this.baseUrl + event.eventUrl;
        }

        // Extract description/summary
        const descriptionSelectors = [
            '[data-testid="event-description"]',
            '.event-description',
            '.description',
            '[class*="description"]',
            'p'
        ];

        for (const selector of descriptionSelectors) {
            const descText = $card.find(selector).first().text().trim();
            if (descText && descText.length > 10) {
                event.description = descText;
                break;
            }
        }

        // Extract category/tags
        const categorySelectors = [
            '[data-testid="event-category"]',
            '.event-category',
            '.category',
            '[class*="category"]',
            '[class*="tag"]'
        ];

        for (const selector of categorySelectors) {
            const categoryText = $card.find(selector).first().text().trim();
            if (categoryText) {
                event.category = categoryText;
                break;
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
     * Parse date and time from text
     * @param {string} dateTimeText - Raw date/time text
     * @returns {Object} Parsed date/time object
     */
    parseDateTime(dateTimeText) {
        if (!dateTimeText) return null;

        // Common patterns for Eventbrite dates
        const patterns = [
            /(\w+),?\s+(\w+)\s+(\d+)\s*[•·]\s*(\d+):(\d+)\s*(AM|PM)/i, // "Friday • 10:00 PM"
            /(\w+)\s+(\d+)\s*[•·]\s*(\d+):(\d+)\s*(AM|PM)/i, // "Sep 14 • 9:00 PM"
            /(\w+)\s+(\d+)\s*[•·]\s*(\d+):(\d+)\s*(AM|PM)/i, // "Sep 20 • 10:30 AM"
        ];

        for (const pattern of patterns) {
            const match = dateTimeText.match(pattern);
            if (match) {
                return {
                    raw: dateTimeText,
                    parsed: match[0],
                    day: match[1],
                    month: match[2],
                    date: match[3],
                    time: `${match[4]}:${match[5]} ${match[6]}`
                };
            }
        }

        return {
            raw: dateTimeText,
            parsed: null
        };
    }

    /**
     * Parse price from text
     * @param {string} priceText - Raw price text
     * @returns {Object} Parsed price object
     */
    parsePrice(priceText) {
        if (!priceText) return null;

        // Extract price information
        const priceMatch = priceText.match(/\$(\d+(?:\.\d{2})?)/);
        const isFree = /free/i.test(priceText);
        const isSoldOut = /sold out|sold-out/i.test(priceText);

        return {
            raw: priceText,
            amount: priceMatch ? parseFloat(priceMatch[1]) : null,
            currency: 'USD',
            isFree: isFree,
            isSoldOut: isSoldOut,
            displayText: priceText
        };
    }

    /**
     * Get detailed event information from event page
     * @param {string} eventUrl - URL of the event page
     * @returns {Object} Detailed event information
     */
    async getEventDetails(eventUrl) {
        try {
            const response = await axios.get(eventUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                timeout: 10000
            });

            const $ = cheerio.load(response.data);

            const details = {
                description: $('[data-testid="event-description"]').text().trim(),
                organizer: $('[data-testid="event-organizer"]').text().trim(),
                capacity: $('[data-testid="event-capacity"]').text().trim(),
                tags: $('[data-testid="event-tags"] a').map((i, el) => $(el).text().trim()).get(),
                fullAddress: $('[data-testid="event-address"]').text().trim(),
                eventType: $('[data-testid="event-type"]').text().trim()
            };

            return details;
        } catch (error) {
            console.error('Error fetching event details:', error);
            return null;
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
                            dateTime: event.dateTime?.raw,
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
                            dateTime: event.dateTime?.raw,
                            location: event.location,
                            venue: event.venue,
                            price: event.price?.amount,
                            priceDisplay: event.price?.displayText,
                            imageUrl: event.imageUrl,
                            eventUrl: event.eventUrl,
                            category: event.category,
                            source: event.source,
                            city: event.city,
                            state: event.state,
                            country: event.country,
                            scrapedAt: event.scrapedAt,
                            metadata: {
                                dateTimeParsed: event.dateTime,
                                priceParsed: event.price
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

module.exports = EventbriteScraperService;
