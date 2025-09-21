const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');

class PretalxScraperService {
    constructor() {
        this.baseUrl = 'https://pretalx.com';
        this.eventsUrl = 'https://pretalx.com/events/';
    }

    async getEventSlugs(options = {}) {
        const {
            maxEvents = null, 
            headless = true,
            delay = 1000
        } = options;

        let browser;
        try {
            console.log('Starting Pretalx event slugs scraper...');

            
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

            
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

            
            await page.setViewport({ width: 1920, height: 1080 });

            console.log('Navigating to Pretalx events page...');
            await page.goto(this.eventsUrl, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            
            const eventSelectors = [
                'a.event',
                'a[href*="/"]',
                '.event-link',
                '[class*="event"]',
                'a[href^="/"]'
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
                
                const bodyLocator = page.locator('body');
                await bodyLocator.waitHandle({ timeout: 5000 });
                console.log('Waiting for page content to load...');
                await new Promise(resolve => setTimeout(resolve, 3000));
            }

            await this.scrollToLoadEvents(page, maxEvents);
            const content = await page.content();
            const $ = cheerio.load(content);
            const eventSlugs = this.parseEventSlugs($, maxEvents);

            console.log(`Successfully scraped ${eventSlugs.length} event slugs`);
            return eventSlugs;

        } catch (error) {
            console.error('Error scraping Pretalx event slugs:', error);
            throw new Error(`Scraping failed: ${error.message}`);
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }


    async scrollToLoadEvents(page, maxEvents) {
        let previousHeight = 0;
        let currentHeight = await page.evaluate('document.body.scrollHeight');
        let scrollAttempts = 0;
        const maxScrollAttempts = maxEvents ? 5 : 20; 

        console.log(`🔄 Starting scroll to load events (maxEvents: ${maxEvents || 'ALL'})`);

        while (currentHeight > previousHeight && scrollAttempts < maxScrollAttempts) {
            
            let eventCount = 0;
            try {
                eventCount = await page.$$eval('a[href^="/"]', elements => elements.length);
                console.log(`📊 Found ${eventCount} event links`);
            } catch (error) {
                
            }

            
            if (maxEvents && eventCount >= maxEvents) {
                console.log(`✅ Reached target of ${maxEvents} events`);
                break;
            }

            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
            await new Promise(resolve => setTimeout(resolve, 1000));
            previousHeight = currentHeight;
            currentHeight = await page.evaluate('document.body.scrollHeight');
            scrollAttempts++;
            console.log(`📜 Scroll attempt ${scrollAttempts}/${maxScrollAttempts}, height: ${currentHeight}`);
        }
        console.log(`🎯 Final scroll complete after ${scrollAttempts} attempts`);
    }

    parseEventSlugs($, maxEvents) {
        const eventSlugs = [];
        const eventSelectors = [
            'a.event',
            'a[href*="/"]',
            '.event-link',
            '[class*="event"]',
            'a[href^="/"]'
        ];

        let eventElements = null;
        let usedSelector = null;

        
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
            return eventSlugs;
        }

        
        const elementsToProcess = maxEvents ? eventElements.slice(0, maxEvents) : eventElements;
        
        console.log(`🔄 Processing ${elementsToProcess.length} elements (maxEvents: ${maxEvents || 'ALL'})`);
        
        elementsToProcess.each((index, element) => {
            try {
                const href = $(element).attr('href');
                if (href && href.startsWith('/') && href !== '/') {
                    
                    const slug = href.replace(/^\/+|\/+$/g, '');
                    if (slug && !eventSlugs.includes(slug)) {
                        eventSlugs.push(slug);
                        if (index % 10 === 0) {
                            console.log(`✅ Processed ${index + 1} event slugs so far...`);
                        }
                    }
                }
            } catch (error) {
                console.warn(`Error parsing event slug ${index}:`, error.message);
            }
        });
        
        console.log(`🎯 Successfully extracted ${eventSlugs.length} unique event slugs`);
        return eventSlugs;
    }

    async getEventDetails(slug) {
        const url = `https://pretalx.com/${slug}/api/talks/`;
        try {
            console.log(`Fetching event details for slug: ${slug}`);
            const { data } = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                timeout: 10000
            });

            return {
                slug: slug,
                eventUrl: `https://pretalx.com/${slug}/`,
                apiUrl: url,
                talks: data.results || data || [],
                totalTalks: data.count || (data.results ? data.results.length : 0),
                scrapedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error(`Error fetching event ${slug}:`, error.message);
            return {
                slug: slug,
                eventUrl: `https://pretalx.com/${slug}/`,
                apiUrl: url,
                talks: [],
                totalTalks: 0,
                error: error.message,
                scrapedAt: new Date().toISOString()
            };
        }
    }

    async getEventPageDetails(slug) {
        const url = `https://pretalx.com/${slug}/`;

        try {
            console.log(`Fetching event page details for slug: ${slug}`);
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                timeout: 10000
            });

            const $ = cheerio.load(response.data);

            const details = {
                title: $('h1, .event-title, .conference-title').first().text().trim(),
                description: $('.event-description, .description, .conference-description').text().trim(),
                location: $('.location, .venue, .conference-location').text().trim(),
                date: $('.date, .event-date, .conference-date').text().trim(),
                website: $('a[href^="http"]').first().attr('href'),
                contactEmail: $('a[href^="mailto:"]').first().attr('href')?.replace('mailto:', ''),
                organizer: $('.organizer, .conference-organizer').text().trim(),
                tags: $('.tag, .badge, .category').map((i, el) => $(el).text().trim()).get(),
                cfpDeadline: $('.cfp-deadline, .submission-deadline').text().trim(),
                eventType: $('.event-type, .conference-type').text().trim()
            };

            return details;
        } catch (error) {
            console.error(`Error fetching event page details for ${slug}:`, error);
            return null;
        }
    }

    async scrapeAllEvents(options = {}) {
        const {
            maxEvents = null,
            headless = true,
            delay = 1000,
            includePageDetails = false
        } = options;

        try {
            console.log('🚀 Starting complete Pretalx scraping process...');
            console.log('📋 Step 1: Getting event slugs...');
            const eventSlugs = await this.getEventSlugs({ maxEvents, headless, delay });
            if (eventSlugs.length === 0) {
                console.log('❌ No event slugs found');
                return [];
            }
            console.log(`✅ Found ${eventSlugs.length} event slugs`);
            console.log('📊 Step 2: Getting event details...');
            const events = [];
            const errors = [];
            const batchSize = 5; 
            for (let i = 0; i < eventSlugs.length; i += batchSize) {
                const batch = eventSlugs.slice(i, i + batchSize);
                console.log(`🔄 Processing batch ${Math.floor(i/batchSize) + 1}: events ${i + 1}-${Math.min(i + batchSize, eventSlugs.length)}`);
                const batchPromises = batch.map(async (slug) => {
                    try {
                        const apiDetails = await this.getEventDetails(slug);
                        let pageDetails = null;
                        if (includePageDetails) {
                            pageDetails = await this.getEventPageDetails(slug);
                        }
                        const event = {
                            ...apiDetails,
                            pageDetails: pageDetails,
                            source: 'Pretalx',
                            scrapedAt: new Date().toISOString()
                        };
                        console.log(`✅ Successfully processed: ${slug} (${apiDetails.totalTalks} talks)`);
                        return { success: true, event };
                    } catch (error) {
                        console.error(`❌ Error processing event ${slug}:`, error.message);
                        return { success: false, slug, error: error.message };
                    }
                });
                const batchResults = await Promise.all(batchPromises);
                batchResults.forEach(result => {
                    if (result.success) {
                        events.push(result.event);
                    } else {
                        errors.push({ slug: result.slug, error: result.error });
                    }
                });
                if (delay > 0 && i + batchSize < eventSlugs.length) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
            console.log(`🎯 Scraping complete! Processed ${events.length} events with ${errors.length} errors`);
            return {
                events,
                errors,
                summary: {
                    totalSlugs: eventSlugs.length,
                    successfulEvents: events.length,
                    failedEvents: errors.length,
                    totalTalks: events.reduce((sum, event) => sum + event.totalTalks, 0)
                }
            };
        } catch (error) {
            console.error('Error in complete scraping process:', error);
            throw new Error(`Complete scraping failed: ${error.message}`);
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
                            title: event.pageDetails?.title || event.slug,
                            eventUrl: event.eventUrl,
                            source: 'Pretalx'
                        }
                    });

                    if (existingEvent) {
                        console.log(`Event already exists: ${event.slug}`);
                        continue;
                    }

                    const newEvent = await db.event.create({
                        data: {
                            title: event.pageDetails?.title || event.slug,
                            description: event.pageDetails?.description || `Pretalx event: ${event.slug}`,
                            dateTime: event.pageDetails?.date,
                            location: event.pageDetails?.location,
                            venue: event.pageDetails?.location,
                            eventUrl: event.eventUrl,
                            category: event.pageDetails?.eventType || 'Conference',
                            source: 'Pretalx',
                            city: this.extractCity(event.pageDetails?.location),
                            state: this.extractState(event.pageDetails?.location),
                            country: this.extractCountry(event.pageDetails?.location),
                            scrapedAt: event.scrapedAt,
                            metadata: {
                                slug: event.slug,
                                apiUrl: event.apiUrl,
                                totalTalks: event.totalTalks,
                                talks: event.talks,
                                pageDetails: event.pageDetails,
                                organizer: event.pageDetails?.organizer,
                                website: event.pageDetails?.website,
                                contactEmail: event.pageDetails?.contactEmail,
                                cfpDeadline: event.pageDetails?.cfpDeadline,
                                tags: event.pageDetails?.tags
                            }
                        }
                    });

                    savedEvents.push(newEvent);
                    console.log(`Saved event: ${event.slug}`);
                } catch (error) {
                    console.error(`Error saving event ${event.slug}:`, error);
                    errors.push({ event: event.slug, error: error.message });
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

    extractCity(location) {
        if (!location) return null;
        
        const cityMatch = location.match(/([A-Za-z\s]+),?\s*[A-Z]{2}/);
        if (cityMatch) {
            return cityMatch[1].trim();
        }
        
        return location.split(',')[0]?.trim() || null;
    }

    extractState(location) {
        if (!location) return null;
        
        const stateMatch = location.match(/,?\s*([A-Z]{2})\s*,?/);
        if (stateMatch) {
            return stateMatch[1];
        }
        
        return null;
    }

    extractCountry(location) {
        if (!location) return null;
        
        const countryMatch = location.match(/,?\s*([A-Za-z\s]+)$/);
        if (countryMatch) {
            return countryMatch[1].trim();
        }
        
        return null;
    }
}

module.exports = PretalxScraperService;
