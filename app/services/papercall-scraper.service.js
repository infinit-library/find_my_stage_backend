const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');

class PaperCallScraperService {
    constructor() {
        this.baseUrl = 'https://www.papercall.io';
        this.eventsUrl = 'https://www.papercall.io/events';
    }

    async scrapePaperCallEvents(options = {}) {
        const {
            maxEvents = null,
            headless = true,
            delay = 1000
        } = options;

        let browser;
        try {
            console.log('Starting PaperCall.io scraper...');

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

            console.log('Navigating to PaperCall.io events page...');
            await page.goto(this.eventsUrl, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            const eventSelectors = [
                '.panel.panel-default',
                '.panel-default',
                '.panel',
                '[class*="panel"]'
            ];            let eventsLoaded = false;
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
            }            if (!eventsLoaded) {                const bodyLocator = page.locator('body');
                await bodyLocator.waitHandle({ timeout: 5000 });
                console.log('Waiting for page content to load...');
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
            await this.scrollToLoadEvents(page, maxEvents);
            const allEvents = await this.handlePagination(page, maxEvents);
            const content = await page.content();
            const $ = cheerio.load(content);            const events = this.parseEvents($, maxEvents);
            if (allEvents.length > 0) {
                events.push(...allEvents);
            }            console.log(`Successfully scraped ${events.length} events`);
            return events;        } catch (error) {
            console.error('Error scraping PaperCall.io:', error);
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
        const maxScrollAttempts = maxEvents ? 10 : 50;


        const eventSelectors = [
            '.panel.panel-default',
            '.panel-default',
            '.panel',
            '[class*="panel"]'
        ];

        console.log(`🔄 Starting scroll to load events (maxEvents: ${maxEvents || 'ALL'})`);

        while (currentHeight > previousHeight && scrollAttempts < maxScrollAttempts) {

            let eventCount = 0;
            for (const selector of eventSelectors) {
                try {
                    eventCount = await page.$$eval(selector, elements => elements.length);
                    if (eventCount > 0) {
                        console.log(`📊 Found ${eventCount} events with selector: ${selector}`);
                        break;
                    }
                } catch (error) {

                }
            }


            if (maxEvents && eventCount >= maxEvents) {
                console.log(`✅ Reached target of ${maxEvents} events`);
                break;
            }


            if (!maxEvents && scrollAttempts > 5) {

                const newEventCount = await page.$$eval('.panel.panel-default, .panel-default, .panel', elements => elements.length);
                if (newEventCount === eventCount) {
                    console.log(`🛑 No new events found after ${scrollAttempts} scrolls, stopping`);
                    break;
                }
            }


            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');


            await new Promise(resolve => setTimeout(resolve, 2000));

            previousHeight = currentHeight;
            currentHeight = await page.evaluate('document.body.scrollHeight');
            scrollAttempts++;

            console.log(`📜 Scroll attempt ${scrollAttempts}/${maxScrollAttempts}, height: ${currentHeight}`);
        }


        let finalEventCount = 0;
        for (const selector of eventSelectors) {
            try {
                finalEventCount = await page.$$eval(selector, elements => elements.length);
                if (finalEventCount > 0) {
                    console.log(`🎯 Final count: ${finalEventCount} events found`);
                    break;
                }
            } catch (error) {

            }
        }
    }

    async handlePagination(page, maxEvents) {
        const allEvents = [];
        let currentPage = 1;
        const maxPages = maxEvents ? Math.ceil(maxEvents / 20) : 10;

        console.log(`🔄 Checking for pagination (max pages: ${maxPages})`);

        try {

            const paginationSelectors = [
                '.pagination',
                '.pager',
                '[class*="pagination"]',
                '[class*="pager"]',
                'a[href*="page="]',
                'a[href*="?page="]'
            ];

            let hasPagination = false;
            for (const selector of paginationSelectors) {
                const elements = await page.$$(selector);
                if (elements.length > 0) {
                    hasPagination = true;
                    console.log(`📄 Found pagination with selector: ${selector}`);
                    break;
                }
            }

            if (!hasPagination) {
                console.log('📄 No pagination found, using single page');
                return allEvents;
            }


            while (currentPage <= maxPages) {
                console.log(`📄 Processing page ${currentPage}...`);


                const content = await page.content();
                const $ = cheerio.load(content);
                const pageEvents = this.parseEvents($, null);

                if (pageEvents.length === 0) {
                    console.log(`📄 No events found on page ${currentPage}, stopping pagination`);
                    break;
                }

                allEvents.push(...pageEvents);
                console.log(`📄 Found ${pageEvents.length} events on page ${currentPage} (total: ${allEvents.length})`);


                if (maxEvents && allEvents.length >= maxEvents) {
                    console.log(`✅ Reached target of ${maxEvents} events across ${currentPage} pages`);
                    break;
                }


                const nextPageSelectors = [
                    `a[href*="page=${currentPage + 1}"]`,
                    `a[href*="?page=${currentPage + 1}"]`,
                    '.pagination .next',
                    '.pager .next',
                    'a:contains("Next")',
                    'a:contains(">")'
                ];

                let nextPageFound = false;
                for (const selector of nextPageSelectors) {
                    try {
                        const nextPageLink = await page.$(selector);
                        if (nextPageLink) {
                            await nextPageLink.click();
                            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
                            nextPageFound = true;
                            console.log(`➡️ Navigated to page ${currentPage + 1}`);
                            break;
                        }
                    } catch (error) {

                    }
                }

                if (!nextPageFound) {
                    console.log(`📄 No next page found, stopping at page ${currentPage}`);
                    break;
                }

                currentPage++;
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

        } catch (error) {
            console.warn('Error handling pagination:', error.message);
        }

        console.log(`📄 Pagination complete: Found ${allEvents.length} events across ${currentPage} pages`);
        return allEvents;
    }

    parseEvents($, maxEvents) {
        const events = [];


        const eventSelectors = [
            '.panel.panel-default',
            '.panel-default',
            '.panel',
            '[class*="panel"]'
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

            const fallbackSelectors = [
                'div[class*="card"]',
                'article',
                'div[class*="tile"]',
                'div[class*="item"]',
                'div[class*="event"]'
            ];

            for (const selector of fallbackSelectors) {
                const elements = $(selector);
                if (elements.length > 0) {
                    console.log(`Trying fallback selector: ${selector} (found ${elements.length} elements)`);
                    console.log(elements, "elements----------------------");
                    eventElements = elements;
                    usedSelector = selector;
                    break;
                }
            }
        }

        if (eventElements && eventElements.length > 0) {

            const elementsToProcess = maxEvents ? eventElements.slice(0, maxEvents) : eventElements;

            console.log(`🔄 Processing ${elementsToProcess.length} elements (maxEvents: ${maxEvents || 'ALL'})`);

            elementsToProcess.each((index, element) => {
                try {
                    const event = this.parseEventCard($, $(element));
                    if (event && event.title) {
                        events.push(event);
                        if (index % 10 === 0) {
                            console.log(`✅ Processed ${index + 1} events so far...`);
                        }
                    }
                } catch (error) {
                    console.warn(`Error parsing event ${index}:`, error.message);
                }
            });

            console.log(`🎯 Successfully parsed ${events.length} events from ${elementsToProcess.length} elements`);
        } else {
            console.log('No event elements found. Page structure may have changed.');
        }

        return events;
    }

    parseEventCard($, $card) {
        const event = {};


        const titleSelectors = [
            'h3',
            'h2',
            'h1',
            'h4',
            '.panel-title',
            '.event-title',
            '.title',
            '[class*="title"]',
            'a[href*="/events/"]',
            'strong',
            'b'
        ];

        for (const selector of titleSelectors) {
            const titleText = $card.find(selector).first().text().trim();
            if (titleText && titleText.length > 3) {
                event.title = titleText;
                break;
            }
        }


        if (!event.title) {
            const linkText = $card.find('a').first().text().trim();
            if (linkText && linkText.length > 3) {
                event.title = linkText;
            }
        }


        const linkElement = $card.find('a').first();
        event.eventUrl = linkElement.attr('href');
        if (event.eventUrl && !event.eventUrl.startsWith('http')) {
            event.eventUrl = this.baseUrl + event.eventUrl;
        }


        const descriptionSelectors = [
            '.panel-body',
            '.description',
            '[class*="description"]',
            'p',
            '.event-description',
            '.summary'
        ];

        for (const selector of descriptionSelectors) {
            const descText = $card.find(selector).first().text().trim();
            if (descText && descText.length > 10) {
                event.description = descText;
                break;
            }
        }


        const locationSelectors = [
            '.location',
            '[class*="location"]',
            '[class*="venue"]',
            'address',
            '.city',
            '.country'
        ];

        for (const selector of locationSelectors) {
            const locationText = $card.find(selector).first().text().trim();
            if (locationText) {
                event.location = locationText;
                break;
            }
        }


        const dateSelectors = [
            '.date',
            '[class*="date"]',
            'time',
            '[datetime]',
            '.event-date',
            '.cfp-date'
        ];

        let dateTimeText = '';
        for (const selector of dateSelectors) {
            dateTimeText = $card.find(selector).first().text().trim();
            if (dateTimeText) break;
        }
        event.dateTime = this.parseDateTime(dateTimeText);


        const cfpSelectors = [
            '.cfp',
            '[class*="cfp"]',
            '.call-for-papers',
            '.submission'
        ];

        for (const selector of cfpSelectors) {
            const cfpText = $card.find(selector).first().text().trim();
            if (cfpText) {
                event.cfpInfo = cfpText;
                break;
            }
        }


        const tagSelectors = [
            '.tags',
            '[class*="tag"]',
            '.categories',
            '[class*="category"]',
            '.badge',
            '[class*="badge"]'
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


        const imgElement = $card.find('img').first();
        event.imageUrl = imgElement.attr('src') || imgElement.attr('data-src') || imgElement.attr('data-lazy');


        const typeSelectors = [
            '.event-type',
            '[class*="type"]',
            '.conference-type'
        ];

        for (const selector of typeSelectors) {
            const typeText = $card.find(selector).first().text().trim();
            if (typeText) {
                event.eventType = typeText;
                break;
            }
        }


        const panelBody = $card.find('.panel-body');
        if (panelBody.length > 0) {

            const panelText = panelBody.text();


            const websiteMatch = panelText.match(/(https?:\/\/[^\s]+)/);
            if (websiteMatch) {
                event.website = websiteMatch[1];
            }


            const emailMatch = panelText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
            if (emailMatch) {
                event.contactEmail = emailMatch[1];
            }
        }


        event.source = 'PaperCall.io';
        event.scrapedAt = new Date().toISOString();

        return event;
    }

    parseDateTime(dateTimeText) {
        if (!dateTimeText) return null;


        const patterns = [
            /(\w+)\s+(\d{1,2}),?\s+(\d{4})/i,
            /(\d{1,2})\s+(\w+)\s+(\d{4})/i,
            /(\w+)\s+(\d{1,2})[-\s]+(\d{1,2}),?\s+(\d{4})/i,
            /(\d{4})[-\s]+(\d{1,2})[-\s]+(\d{1,2})/i,
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
                description: $('.event-description, .description, .panel-body').text().trim(),
                website: $('a[href^="http"]').first().attr('href'),
                contactEmail: $('a[href^="mailto:"]').first().attr('href')?.replace('mailto:', ''),
                fullAddress: $('.address, .location, .venue').text().trim(),
                eventType: $('.event-type, .conference-type').text().trim(),
                cfpDeadline: $('.cfp-deadline, .submission-deadline').text().trim(),
                tags: $('.tag, .badge, .category').map((i, el) => $(el).text().trim()).get()
            };

            return details;
        } catch (error) {
            console.error('Error fetching event details:', error);
            return null;
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
                            eventUrl: event.eventUrl,
                            source: 'PaperCall.io'
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
                            dateTime: event.dateTime?.raw,
                            location: event.location,
                            venue: event.venue,
                            imageUrl: event.imageUrl,
                            eventUrl: event.eventUrl,
                            category: event.eventType,
                            source: event.source,
                            city: this.extractCity(event.location),
                            state: this.extractState(event.location),
                            country: this.extractCountry(event.location),
                            scrapedAt: event.scrapedAt,
                            metadata: {
                                dateTimeParsed: event.dateTime,
                                cfpInfo: event.cfpInfo,
                                tags: event.tags,
                                website: event.website,
                                contactEmail: event.contactEmail
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

module.exports = PaperCallScraperService;
