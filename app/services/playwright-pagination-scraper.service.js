const { chromium } = require('playwright');
const cheerio = require('cheerio');

class PlaywrightPaginationScraperService {
    constructor() {
        this.baseUrl = 'https://www.papercall.io';
        this.eventsUrl = 'https://www.papercall.io/events';
    }

    /**
     * Scrape events from PaperCall.io with full pagination support
     * @param {Object} options - Scraping options
     * @param {number} options.maxEvents - Maximum number of events to scrape (null for all)
     * @param {boolean} options.headless - Run browser in headless mode
     * @param {number} options.delay - Delay between requests in ms
     * @param {number} options.maxPages - Maximum number of pages to scrape
     * @param {boolean} options.scrollToLoad - Whether to scroll to load more content
     * @returns {Array} Array of event objects
     */
    async scrapeWithPagination(options = {}) {
        const {
            maxEvents = null, // Set to null to get ALL events
            headless = true,
            delay = 2000,
            maxPages = 50, // Maximum pages to scrape
            scrollToLoad = true
        } = options;

        let browser;
        let context;
        let page;
        const allEvents = [];

        try {
            console.log('🚀 Starting Playwright pagination scraper...');
            console.log(`📊 Target: ${maxEvents || 'ALL'} events, max pages: ${maxPages}`);

            // Launch browser with optimized settings
            browser = await chromium.launch({
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

            // Create context with realistic settings
            context = await browser.newContext({
                viewport: { width: 1920, height: 1080 },
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                locale: 'en-US',
                timezoneId: 'America/Los_Angeles'
            });

            page = await context.newPage();

            // Set up request interception to block unnecessary resources
            await page.route('**/*', (route) => {
                const resourceType = route.request().resourceType();
                if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
                    route.abort();
                } else {
                    route.continue();
                }
            });

            // Navigate to the events page
            console.log('🌐 Navigating to PaperCall.io events page...');
            await page.goto(this.eventsUrl, {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });

            // Wait for initial content to load
            await this.waitForContent(page);

            let currentPage = 1;
            let hasMorePages = true;

            while (hasMorePages && currentPage <= maxPages) {
                console.log(`📄 Processing page ${currentPage}...`);

                // Verify we're still on the events page
                const currentUrl = page.url();
                if (!currentUrl.includes('/events')) {
                    console.log(`❌ Not on events page anymore (${currentUrl}), stopping pagination`);
                    break;
                }

                // Scroll to load more content if enabled
                if (scrollToLoad) {
                    await this.scrollToLoadContent(page);
                }

                // Extract events from current page
                const pageEvents = await this.extractEventsFromPage(page);
                
                if (pageEvents.length === 0) {
                    console.log(`📄 No events found on page ${currentPage}, stopping pagination`);
                    break;
                }

                allEvents.push(...pageEvents);
                console.log(`📄 Found ${pageEvents.length} events on page ${currentPage} (total: ${allEvents.length})`);

                // Check if we have enough events
                if (maxEvents && allEvents.length >= maxEvents) {
                    console.log(`✅ Reached target of ${maxEvents} events across ${currentPage} pages`);
                    break;
                }

                // Try to navigate to next page
                const nextPageSuccess = await this.navigateToNextPage(page);
                if (!nextPageSuccess) {
                    console.log(`📄 No next page found, stopping at page ${currentPage}`);
                    hasMorePages = false;
                } else {
                    currentPage++;
                    // Wait between page navigations
                    await page.waitForTimeout(delay);
                }
            }

            // Limit results if maxEvents is specified
            const finalEvents = maxEvents ? allEvents.slice(0, maxEvents) : allEvents;

            console.log(`🎯 Scraping complete: Found ${finalEvents.length} events across ${currentPage} pages`);
            return finalEvents;

        } catch (error) {
            console.error('❌ Error in Playwright pagination scraper:', error);
            throw new Error(`Pagination scraping failed: ${error.message}`);
        } finally {
            if (context) await context.close();
            if (browser) await browser.close();
        }
    }

    /**
     * Wait for content to load on the page
     * @param {Object} page - Playwright page object
     */
    async waitForContent(page) {
        const selectors = [
            '.panel.panel-default',
            '.panel-default',
            '.panel',
            '[class*="panel"]',
            'div[class*="card"]',
            'article',
            'div[class*="tile"]'
        ];

        for (const selector of selectors) {
            try {
                await page.waitForSelector(selector, { timeout: 5000 });
                console.log(`✅ Content loaded with selector: ${selector}`);
                return;
            } catch (error) {
                // Continue to next selector
            }
        }

        // Fallback: wait for any content
        console.log('⏳ Waiting for any content to load...');
        await page.waitForTimeout(3000);
    }

    /**
     * Scroll to load more content on the page
     * @param {Object} page - Playwright page object
     */
    async scrollToLoadContent(page) {
        console.log('📜 Scrolling to load more content...');
        
        let previousHeight = 0;
        let currentHeight = await page.evaluate('document.body.scrollHeight');
        let scrollAttempts = 0;
        const maxScrollAttempts = 10;

        while (currentHeight > previousHeight && scrollAttempts < maxScrollAttempts) {
            // Scroll to bottom
            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
            
            // Wait for new content to load
            await page.waitForTimeout(2000);
            
            previousHeight = currentHeight;
            currentHeight = await page.evaluate('document.body.scrollHeight');
            scrollAttempts++;
            
            console.log(`📜 Scroll attempt ${scrollAttempts}/${maxScrollAttempts}, height: ${currentHeight}`);
        }

        // Scroll back to top
        await page.evaluate('window.scrollTo(0, 0)');
        await page.waitForTimeout(1000);
    }

    /**
     * Extract events from the current page
     * @param {Object} page - Playwright page object
     * @returns {Array} Array of event objects
     */
    async extractEventsFromPage(page) {
        const events = [];

        // Get page content
        const content = await page.content();
        const $ = cheerio.load(content);

        // Find event elements using multiple selectors
        const eventSelectors = [
            '.panel.panel-default',
            '.panel-default',
            '.panel',
            '[class*="panel"]',
            'div[class*="card"]',
            'article',
            'div[class*="tile"]'
        ];

        let eventElements = null;
        let usedSelector = null;

        for (const selector of eventSelectors) {
            const elements = $(selector);
            if (elements.length > 0) {
                eventElements = elements;
                usedSelector = selector;
                console.log(`🔍 Using selector: ${selector} (found ${elements.length} elements)`);
                break;
            }
        }

        if (!eventElements || eventElements.length === 0) {
            console.log('⚠️ No event elements found on current page');
            return events;
        }

        // Parse each event element
        eventElements.each((index, element) => {
            try {
                const event = this.parseEventCard($, $(element));
                if (event && event.title) {
                    events.push(event);
                }
            } catch (error) {
                console.warn(`⚠️ Error parsing event ${index}:`, error.message);
            }
        });

        return events;
    }

    /**
     * Navigate to the next page
     * @param {Object} page - Playwright page object
     * @returns {boolean} True if navigation was successful
     */
    async navigateToNextPage(page) {
        const currentUrl = page.url();
        const urlMatch = currentUrl.match(/[?&]page=(\d+)/);
        const currentPageNum = urlMatch ? parseInt(urlMatch[1]) : 1;
        const nextPageNum = currentPageNum + 1;

        console.log(`🔍 Looking for page ${nextPageNum} navigation...`);

        // Method 1: Try to find direct page number link first (most reliable)
        try {
            const nextPageLink = await page.$(`a[href*="page=${nextPageNum}"]`);
            if (nextPageLink) {
                const href = await nextPageLink.getAttribute('href');
                console.log(`➡️ Found direct page link: ${href}`);
                
                // Verify it's actually a page link, not an event link
                if (href && href.includes(`page=${nextPageNum}`) && !href.includes('/events/')) {
                    await nextPageLink.click();
                    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
                    
                    // Verify we're still on the events page
                    const newUrl = page.url();
                    if (newUrl.includes('/events') && newUrl.includes(`page=${nextPageNum}`)) {
                        console.log(`✅ Successfully navigated to page ${nextPageNum}`);
                        return true;
                    } else {
                        console.log(`❌ Navigation went to wrong page: ${newUrl}`);
                        // Go back to events page
                        await page.goto(`https://www.papercall.io/events?page=${nextPageNum}`, { 
                            waitUntil: 'domcontentloaded', 
                            timeout: 10000 
                        });
                        return true;
                    }
                }
            }
        } catch (error) {
            console.log(`❌ Direct page link method failed: ${error.message}`);
        }

        // Method 2: Try "Next" button but verify it goes to the right place
        const nextPageSelectors = [
            'a:has-text("Next")',
            'a:has-text(">")',
            'a:has-text("→")',
            '.pagination .next',
            '.pager .next',
            '[class*="next"]'
        ];

        for (const selector of nextPageSelectors) {
            try {
                const nextButton = await page.$(selector);
                if (nextButton) {
                    // Check if the button is enabled/clickable
                    const isDisabled = await nextButton.evaluate(el => 
                        el.disabled || el.classList.contains('disabled') || el.getAttribute('aria-disabled') === 'true'
                    );
                    
                    if (!isDisabled) {
                        const href = await nextButton.getAttribute('href');
                        console.log(`➡️ Found next button with selector: ${selector}, href: ${href}`);
                        
                        // Verify it's going to the right page
                        if (href && href.includes(`page=${nextPageNum}`)) {
                            await nextButton.click();
                            await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
                            
                            // Verify we're still on the events page
                            const newUrl = page.url();
                            if (newUrl.includes('/events') && newUrl.includes(`page=${nextPageNum}`)) {
                                console.log(`✅ Successfully navigated to page ${nextPageNum}`);
                                return true;
                            } else {
                                console.log(`❌ Next button went to wrong page: ${newUrl}`);
                                // Go back to events page
                                await page.goto(`https://www.papercall.io/events?page=${nextPageNum}`, { 
                                    waitUntil: 'domcontentloaded', 
                                    timeout: 10000 
                                });
                                return true;
                            }
                        }
                    }
                }
            } catch (error) {
                // Continue to next selector
            }
        }

        // Method 3: Direct URL navigation as fallback
        try {
            const nextPageUrl = `https://www.papercall.io/events?page=${nextPageNum}`;
            console.log(`🔗 Trying direct URL navigation: ${nextPageUrl}`);
            await page.goto(nextPageUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
            
            // Verify we have events on this page
            const eventCount = await page.$$eval('.panel.panel-default', elements => elements.length);
            if (eventCount > 0) {
                console.log(`✅ Successfully navigated to page ${nextPageNum} with ${eventCount} events`);
                return true;
            } else {
                console.log(`❌ Page ${nextPageNum} has no events, stopping pagination`);
                return false;
            }
        } catch (error) {
            console.log(`❌ Direct URL navigation failed: ${error.message}`);
        }

        return false;
    }

    /**
     * Parse individual event card
     * @param {Object} $ - Cheerio instance
     * @param {Object} $card - Event card element
     * @returns {Object} Parsed event object
     */
    parseEventCard($, $card) {
        const event = {};

        // Extract title - try multiple selectors
        const titleSelectors = [
            'h3', 'h2', 'h1', 'h4',
            '.panel-title', '.event-title', '.title',
            '[class*="title"]', 'a[href*="/events/"]',
            'strong', 'b'
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

        // Extract event URL
        const linkElement = $card.find('a').first();
        event.eventUrl = linkElement.attr('href');
        if (event.eventUrl && !event.eventUrl.startsWith('http')) {
            event.eventUrl = this.baseUrl + event.eventUrl;
        }

        // Extract description/summary
        const descriptionSelectors = [
            '.panel-body', '.description', '[class*="description"]',
            'p', '.event-description', '.summary'
        ];

        for (const selector of descriptionSelectors) {
            const descText = $card.find(selector).first().text().trim();
            if (descText && descText.length > 10) {
                event.description = descText;
                break;
            }
        }

        // Extract location
        const locationSelectors = [
            '.location', '[class*="location"]', '[class*="venue"]',
            'address', '.city', '.country'
        ];

        for (const selector of locationSelectors) {
            const locationText = $card.find(selector).first().text().trim();
            if (locationText) {
                event.location = locationText;
                break;
            }
        }

        // Extract dates
        const dateSelectors = [
            '.date', '[class*="date"]', 'time', '[datetime]',
            '.event-date', '.cfp-date'
        ];

        let dateTimeText = '';
        for (const selector of dateSelectors) {
            dateTimeText = $card.find(selector).first().text().trim();
            if (dateTimeText) break;
        }
        event.dateTime = this.parseDateTime(dateTimeText);

        // Extract CFP information
        const cfpSelectors = [
            '.cfp', '[class*="cfp"]', '.call-for-papers', '.submission'
        ];

        for (const selector of cfpSelectors) {
            const cfpText = $card.find(selector).first().text().trim();
            if (cfpText) {
                event.cfpInfo = cfpText;
                break;
            }
        }

        // Extract tags/categories
        const tagSelectors = [
            '.tags', '[class*="tag"]', '.categories', '[class*="category"]',
            '.badge', '[class*="badge"]'
        ];

        const tags = [];
        for (const selector of tagSelectors) {
            $card.find(selector).each((i, el) => {
                const tagText = $(el).text().trim();
                if (tagText) {
                    tags.push(tagText);
                }
            });
        }
        event.tags = tags;

        // Extract image URL
        const imgElement = $card.find('img').first();
        event.imageUrl = imgElement.attr('src') || imgElement.attr('data-src') || imgElement.attr('data-lazy');

        // Extract event type
        const typeSelectors = [
            '.event-type', '[class*="type"]', '.conference-type'
        ];

        for (const selector of typeSelectors) {
            const typeText = $card.find(selector).first().text().trim();
            if (typeText) {
                event.eventType = typeText;
                break;
            }
        }

        // Extract organizer information
        const organizerSelectors = [
            '.organizer', '[class*="organizer"]', '.host', '[class*="host"]',
            '.company', '[class*="company"]', '.sponsor', '[class*="sponsor"]',
            '.by', '.presented-by', '.hosted-by'
        ];

        for (const selector of organizerSelectors) {
            const organizerText = $card.find(selector).first().text().trim();
            if (organizerText && organizerText.length > 2) {
                event.organizer = organizerText;
                break;
            }
        }

        // If no organizer found in specific selectors, try to extract from description
        if (!event.organizer && event.description) {
            // Look for patterns like "by [organizer]", "hosted by [organizer]", etc.
            const organizerPatterns = [
                /(?:by|hosted by|presented by|organized by|sponsored by)\s+([^,.\n]+)/i,
                /([^,.\n]+)\s+(?:presents?|hosts?|organizes?)/i
            ];
            
            for (const pattern of organizerPatterns) {
                const match = event.description.match(pattern);
                if (match && match[1]) {
                    event.organizer = match[1].trim();
                    break;
                }
            }
        }

        // Extract additional metadata
        const panelBody = $card.find('.panel-body');
        if (panelBody.length > 0) {
            const panelText = panelBody.text();
            
            // Extract website URL
            const websiteMatch = panelText.match(/(https?:\/\/[^\s]+)/);
            if (websiteMatch) {
                event.website = websiteMatch[1];
            }

            // Extract contact information
            const emailMatch = panelText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
            if (emailMatch) {
                event.contactEmail = emailMatch[1];
            }
        }

        // Add metadata
        event.source = 'PaperCall.io';
        event.scrapedAt = new Date().toISOString();

        return event;
    }

    /**
     * Parse date and time from text
     * @param {string} dateTimeText - Raw date/time text
     * @returns {Object} Parsed date/time object
     */
    parseDateTime(dateTimeText) {
        if (!dateTimeText) return null;

        const patterns = [
            /(\w+)\s+(\d{1,2}),?\s+(\d{4})/i, // "September 10, 2025"
            /(\d{1,2})\s+(\w+)\s+(\d{4})/i, // "10 September 2025"
            /(\w+)\s+(\d{1,2})[-\s]+(\d{1,2}),?\s+(\d{4})/i, // "September 10-11, 2025"
            /(\d{4})[-\s]+(\d{1,2})[-\s]+(\d{1,2})/i, // "2025-09-10"
        ];

        for (const pattern of patterns) {
            const match = dateTimeText.match(pattern);
            if (match) {
                return {
                    raw: dateTimeText,
                    parsed: match[0],
                    extracted: match
                };
            }
        }

        return {
            raw: dateTimeText,
            parsed: null
        };
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
                            eventUrl: event.eventUrl
                        }
                    });

                    if (existingEvent) {
                        console.log(`📋 Event already exists: ${event.title}`);
                        continue;
                    }

                    // Create new event - mapping to your actual database schema
                    const newEvent = await db.event.create({
                        data: {
                            title: event.title,
                            description: event.description,
                            date: event.dateTime?.raw ? new Date(event.dateTime.raw) : new Date(),
                            location: event.location,
                            imageUrl: event.imageUrl,
                            eventUrl: event.eventUrl,
                            source: event.source || 'PaperCall.io',
                            sourceId: this.getSourceId(event.source || 'PaperCall.io'), // Unique integer for each site
                            organizer: event.organizer, // Event organizer name
                            state: this.extractState(event.location),
                            scrapedAt: new Date(event.scrapedAt)
                        }
                    });

                    savedEvents.push(newEvent);
                    console.log(`💾 Saved event: ${event.title}`);
                } catch (error) {
                    console.error(`❌ Error saving event ${event.title}:`, error);
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
            console.error('❌ Error saving events to database:', error);
            throw error;
        }
    }

    /**
     * Extract city from location string
     * @param {string} location - Location string
     * @returns {string} Extracted city
     */
    extractCity(location) {
        if (!location) return null;
        
        const cityMatch = location.match(/([A-Za-z\s]+),?\s*[A-Z]{2}/);
        if (cityMatch) {
            return cityMatch[1].trim();
        }
        
        return location.split(',')[0]?.trim() || null;
    }

    /**
     * Extract state from location string
     * @param {string} location - Location string
     * @returns {string} Extracted state
     */
    extractState(location) {
        if (!location) return null;
        
        const stateMatch = location.match(/,?\s*([A-Z]{2})\s*,?/);
        if (stateMatch) {
            return stateMatch[1];
        }
        
        return null;
    }

    /**
     * Extract country from location string
     * @param {string} location - Location string
     * @returns {string} Extracted country
     */
    extractCountry(location) {
        if (!location) return null;
        
        const countryMatch = location.match(/,?\s*([A-Za-z\s]+)$/);
        if (countryMatch) {
            return countryMatch[1].trim();
        }
        
        return null;
    }

    /**
     * Get unique integer ID for each source site
     * @param {string} source - The source name (e.g., 'PaperCall.io', 'Eventbrite')
     * @returns {number} - Unique integer ID for the source
     */
    getSourceId(source) {
        const sourceMapping = {
            'PaperCall.io': 1,
            'Eventbrite': 2,
            'Meetup': 3,
            'Dev.to': 4,
            'Conference': 5,
            'Workshop': 6,
            'Webinar': 7,
            'Hackathon': 8,
            'Other': 9
        };
        
        return sourceMapping[source] || 9; // Default to 'Other' if source not found
    }
}

module.exports = PlaywrightPaginationScraperService;
