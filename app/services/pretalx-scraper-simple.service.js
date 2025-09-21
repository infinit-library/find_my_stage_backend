const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');

class PretalxScraperSimpleService {
    constructor() {
        this.baseUrl = 'https://pretalx.com';
        this.eventsUrl = 'https://pretalx.com/events/';
    }

    /**
     * Simple and robust Pretalx scraper for search modal
     * @param {Object} options - Scraping options
     * @returns {Object} Scraping result
     */
    async scrapeEventsSimple(options = {}) {
        const {
            maxEvents = 20,
            headless = true,
            delay = 500
        } = options;

        let browser;
        try {
            console.log('🚀 Starting simple Pretalx scraper...');

            // Launch browser with minimal configuration
            browser = await puppeteer.launch({
                headless: headless,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor'
                ],
                timeout: 30000
            });

            const page = await browser.newPage();
            
            // Set user agent
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            await page.setViewport({ width: 1920, height: 1080 });

            console.log('📄 Navigating to Pretalx events page...');
            await page.goto(this.eventsUrl, { 
                waitUntil: 'domcontentloaded',
                timeout: 20000 
            });

            // Wait a bit for content to load
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Get page content
            const content = await page.content();
            const $ = cheerio.load(content);

            // Extract event links - try multiple selectors
            const eventSlugs = [];
            const selectors = [
                'a[href^="/"]',
                'a.event',
                '.event-link',
                'a[href*="/"]'
            ];

            for (const selector of selectors) {
                $(selector).each((i, el) => {
                    const href = $(el).attr('href');
                    if (href && href.startsWith('/') && href !== '/' && href.length > 1) {
                        const slug = href.replace(/^\/+|\/+$/g, '');
                        if (slug && !eventSlugs.includes(slug) && eventSlugs.length < maxEvents) {
                            eventSlugs.push(slug);
                        }
                    }
                });
                
                if (eventSlugs.length > 0) {
                    console.log(`✅ Found ${eventSlugs.length} event slugs using selector: ${selector}`);
                    break;
                }
            }

            if (eventSlugs.length === 0) {
                console.log('⚠️ No event slugs found, returning empty result');
                return {
                    events: [],
                    summary: {
                        totalSlugs: 0,
                        successfulEvents: 0,
                        failedEvents: 0,
                        totalTalks: 0
                    },
                    errors: []
                };
            }

            console.log(`📊 Processing ${eventSlugs.length} event slugs...`);

            // Get basic event details (no page scraping for speed)
            const events = [];
            const errors = [];

            for (let i = 0; i < eventSlugs.length; i++) {
                const slug = eventSlugs[i];
                try {
                    console.log(`🔄 Processing ${i + 1}/${eventSlugs.length}: ${slug}`);
                    
                    // Get API data
                    const apiDetails = await this.getEventDetailsSimple(slug);
                    
                    if (apiDetails && apiDetails.totalTalks > 0) {
                        const event = {
                            slug: slug,
                            eventUrl: `https://pretalx.com/${slug}/`,
                            apiUrl: `https://pretalx.com/${slug}/api/talks/`,
                            totalTalks: apiDetails.totalTalks,
                            talks: apiDetails.talks || [],
                            pageDetails: null, // Skip page details for speed
                            source: 'Pretalx',
                            scrapedAt: new Date().toISOString()
                        };
                        
                        events.push(event);
                        console.log(`✅ Successfully processed: ${slug} (${apiDetails.totalTalks} talks)`);
                    } else {
                        console.log(`⚠️ No talks found for: ${slug}`);
                    }

                    // Small delay between requests
                    if (delay > 0 && i < eventSlugs.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }

                } catch (error) {
                    console.error(`❌ Error processing event ${slug}:`, error.message);
                    errors.push({ slug, error: error.message });
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
            console.error('❌ Simple Pretalx scraper error:', error);
            return {
                events: [],
                errors: [{ error: error.message }],
                summary: {
                    totalSlugs: 0,
                    successfulEvents: 0,
                    failedEvents: 1,
                    totalTalks: 0
                }
            };
        } finally {
            if (browser) {
                try {
                    await browser.close();
                } catch (error) {
                    console.error('Error closing browser:', error);
                }
            }
        }
    }

    /**
     * Get event details from Pretalx API (simplified)
     * @param {string} slug - Event slug
     * @returns {Object} Event details
     */
    async getEventDetailsSimple(slug) {
        const url = `https://pretalx.com/${slug}/api/talks/`;

        try {
            const { data } = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                timeout: 10000
            });

            return {
                slug: slug,
                talks: data.results || data || [],
                totalTalks: data.count || (data.results ? data.results.length : 0)
            };
        } catch (error) {
            console.error(`Error fetching event ${slug}:`, error.message);
            return {
                slug: slug,
                talks: [],
                totalTalks: 0,
                error: error.message
            };
        }
    }
}

module.exports = PretalxScraperSimpleService;

