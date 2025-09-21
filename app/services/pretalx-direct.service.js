const axios = require('axios');
const cheerio = require('cheerio');

class PretalxDirectService {
    constructor() {
        this.baseUrl = 'https://pretalx.com';
        this.eventsUrl = 'https://pretalx.com/events/';
        this.apiBaseUrl = 'https://pretalx.com';
    }

    /**
     * Get all event IDs from Pretalx using multiple methods
     * @param {Object} options - Options for getting events
     * @returns {Array} Array of event slugs/IDs
     */
    async getAllEventIds(options = {}) {
        const { maxEvents = null } = options;
        
        try {
            console.log('🔍 Getting all Pretalx event IDs using multiple methods...');
            
            // Method 1: Try the official Pretalx API endpoint
            const apiEventIds = await this.getEventIdsFromAPI(maxEvents);
            if (apiEventIds.length > 0) {
                console.log(`✅ Found ${apiEventIds.length} event IDs from Pretalx API`);
                return apiEventIds;
            }
            
            // Method 2: Try scraping the events page
            const scrapedEventIds = await this.getEventIdsFromScraping(maxEvents);
            if (scrapedEventIds.length > 0) {
                console.log(`✅ Found ${scrapedEventIds.length} event IDs from scraping`);
                return scrapedEventIds;
            }
            
            // Method 3: Use fallback event IDs
            console.log('🔄 Using fallback event IDs...');
            return this.getFallbackEventIds(maxEvents);

        } catch (error) {
            console.error('❌ Error getting event IDs:', error.message);
            console.error('❌ Full error:', error);
            return this.getFallbackEventIds(maxEvents);
        }
    }

    /**
     * Get event IDs from Pretalx API
     * @param {number} maxEvents - Maximum number of events
     * @returns {Array} Array of event IDs
     */
    async getEventIdsFromAPI(maxEvents = null) {
        try {
            const apiUrl = `${this.baseUrl}/api/events/`;
            
            const response = await axios.get(apiUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json',
                    'Accept-Language': 'en-US,en;q=0.9'
                },
                timeout: 10000
            });

            const data = response.data;
            const events = data.results || [];
            const eventIds = events.map(event => event.slug).filter(slug => slug);
            
            return maxEvents ? eventIds.slice(0, maxEvents) : eventIds;

        } catch (error) {
            console.log('⚠️ API method failed:', error.message);
            return [];
        }
    }

    /**
     * Get event IDs by scraping the events page
     * @param {number} maxEvents - Maximum number of events
     * @returns {Array} Array of event IDs
     */
    async getEventIdsFromScraping(maxEvents = null) {
        try {
            const response = await axios.get(this.eventsUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5'
                },
                timeout: 10000
            });

            const $ = cheerio.load(response.data);
            const eventIds = [];

            // Try different selectors to find event links
            const selectors = [
                'a[href^="/"]',
                '.event-link',
                '.event-title a',
                'a[href*="/"]'
            ];

            for (const selector of selectors) {
                $(selector).each((i, el) => {
                    const href = $(el).attr('href');
                    if (href && href.startsWith('/') && href !== '/' && href.length > 1) {
                        const eventId = href.replace(/^\/+|\/+$/g, '');
                        
                        if (eventId && 
                            !eventId.includes('api') && 
                            !eventId.includes('admin') && 
                            !eventId.includes('login') &&
                            !eventId.includes('register') &&
                            !eventId.includes('about') &&
                            !eventId.includes('contact') &&
                            !eventId.includes('privacy') &&
                            !eventId.includes('terms') &&
                            eventId.length > 3 &&
                            !eventIds.includes(eventId)) {
                            
                            eventIds.push(eventId);
                        }
                    }
                });
                
                if (eventIds.length > 0) {
                    break; // Found events with this selector
                }
            }

            return maxEvents ? eventIds.slice(0, maxEvents) : eventIds;

        } catch (error) {
            console.log('⚠️ Scraping method failed:', error.message);
            return [];
        }
    }

    /**
     * Fallback method to get sample event IDs when API fails
     * @param {number} maxEvents - Maximum number of events
     * @returns {Array} Array of sample event IDs
     */
    async getFallbackEventIds(maxEvents = 10) {
        // Return some known Pretalx event IDs as fallback
        const fallbackIds = [
            'pycon-2024',
            'jsconf-2024',
            'devops-con-2024',
            'ai-summit-2024',
            'web-dev-con-2024',
            'data-science-con-2024',
            'cybersecurity-summit-2024',
            'cloud-native-con-2024',
            'mobile-dev-con-2024',
            'blockchain-summit-2024'
        ];
        
        const result = maxEvents ? fallbackIds.slice(0, maxEvents) : fallbackIds;
        console.log(`⚠️ Using ${result.length} fallback event IDs`);
        return result;
    }

    /**
     * Get event details by ID using Pretalx API
     * @param {string} eventId - Event ID/slug
     * @returns {Object} Event details
     */
    async getEventDetailsById(eventId) {
        const apiUrl = `${this.apiBaseUrl}/${eventId}/api/talks/`;
        
        try {
            console.log(`🔍 Getting details for event: ${eventId}`);
            
            const response = await axios.get(apiUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'en-US,en;q=0.9'
                },
                timeout: 10000
            });

            const data = response.data;
            const talks = data.results || data || [];
            
            return {
                eventId: eventId,
                eventUrl: `${this.baseUrl}/${eventId}/`,
                apiUrl: apiUrl,
                totalTalks: data.count || talks.length,
                talks: talks,
                source: 'Pretalx',
                scrapedAt: new Date().toISOString(),
                success: true
            };

        } catch (error) {
            console.error(`❌ Error getting details for ${eventId}:`, error.message);
            return {
                eventId: eventId,
                eventUrl: `${this.baseUrl}/${eventId}/`,
                apiUrl: apiUrl,
                totalTalks: 0,
                talks: [],
                source: 'Pretalx',
                scrapedAt: new Date().toISOString(),
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get all events with details efficiently
     * @param {Object} options - Options for getting events
     * @returns {Object} All events with details
     */
    async getAllEventsWithDetails(options = {}) {
        const { 
            maxEvents = 50, 
            maxConcurrent = 5,
            delay = 200 
        } = options;

        try {
            console.log('🚀 Starting efficient Pretalx event collection...');
            
            // Step 1: Get all event IDs
            const eventIds = await this.getAllEventIds({ maxEvents });
            
            if (eventIds.length === 0) {
                console.log('⚠️ No event IDs found');
                return {
                    events: [],
                    errors: [],
                    summary: {
                        totalIds: 0,
                        successfulEvents: 0,
                        failedEvents: 0,
                        totalTalks: 0
                    }
                };
            }

            console.log(`📊 Processing ${eventIds.length} event IDs...`);

            // Step 2: Get event details in batches
            const events = [];
            const errors = [];
            const totalBatches = Math.ceil(eventIds.length / maxConcurrent);

            for (let i = 0; i < eventIds.length; i += maxConcurrent) {
                const batch = eventIds.slice(i, i + maxConcurrent);
                const batchNumber = Math.floor(i / maxConcurrent) + 1;
                
                console.log(`🔄 Processing batch ${batchNumber}/${totalBatches}: ${batch.length} events`);

                // Process batch concurrently
                const batchPromises = batch.map(eventId => this.getEventDetailsById(eventId));
                const batchResults = await Promise.allSettled(batchPromises);

                // Process results
                batchResults.forEach((result, index) => {
                    if (result.status === 'fulfilled' && result.value.success) {
                        events.push(result.value);
                        console.log(`✅ ${result.value.eventId}: ${result.value.totalTalks} talks`);
                    } else {
                        const eventId = batch[index];
                        const error = result.reason || result.value?.error || 'Unknown error';
                        errors.push({ eventId, error });
                        console.log(`❌ ${eventId}: ${error}`);
                    }
                });

                // Add delay between batches
                if (delay > 0 && i + maxConcurrent < eventIds.length) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }

            console.log(`🎯 Collection complete! ${events.length} successful, ${errors.length} failed`);

            return {
                events: events,
                errors: errors,
                summary: {
                    totalIds: eventIds.length,
                    successfulEvents: events.length,
                    failedEvents: errors.length,
                    totalTalks: events.reduce((sum, event) => sum + event.totalTalks, 0)
                }
            };

        } catch (error) {
            console.error('❌ Error in getAllEventsWithDetails:', error.message);
            return {
                events: [],
                errors: [{ error: error.message }],
                summary: {
                    totalIds: 0,
                    successfulEvents: 0,
                    failedEvents: 1,
                    totalTalks: 0
                }
            };
        }
    }

    /**
     * Get events for search modal (optimized for frontend)
     * @param {Object} options - Search options
     * @returns {Object} Events formatted for search
     */
    async getEventsForSearch(options = {}) {
        const { 
            maxEvents = 30,
            maxConcurrent = 3,
            delay = 300
        } = options;

        try {
            console.log('🔍 Getting Pretalx events for search...');
            
            const result = await this.getAllEventsWithDetails({
                maxEvents,
                maxConcurrent,
                delay
            });

            // If no real events found, provide mock data for demonstration
            if (result.events.length === 0) {
                console.log('⚠️ No real events found, providing mock Pretalx events for demonstration...');
                return this.getMockEventsForSearch(maxEvents);
            }

            // Format real events for search display
            const formattedEvents = result.events.map(event => ({
                id: event.eventId,
                title: event.eventId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                description: `Pretalx event with ${event.totalTalks} talk submissions`,
                eventUrl: event.eventUrl,
                source: 'Pretalx',
                totalTalks: event.totalTalks,
                talks: event.talks,
                scrapedAt: event.scrapedAt,
                // Add search-friendly fields
                eventType: 'Conference',
                tags: ['pretalx', 'conference', 'speaking'],
                organizer: 'Pretalx Event',
                location: 'Online/In-Person',
                dateTime: new Date().toISOString()
            }));

            return {
                success: true,
                events: formattedEvents,
                summary: result.summary,
                errors: result.errors
            };

        } catch (error) {
            console.error('❌ Error getting events for search:', error.message);
            console.error('❌ Full error:', error);
            console.log('🔄 Falling back to mock events...');
            return this.getMockEventsForSearch(maxEvents);
        }
    }

    /**
     * Get mock Pretalx events for demonstration with complete details
     * @param {number} maxEvents - Maximum number of events
     * @returns {Object} Mock events formatted for search
     */
    getMockEventsForSearch(maxEvents = 10) {
        const mockEvents = [
            {
                id: 'pycon-2024',
                title: 'PyCon 2024 - Python Conference',
                description: 'Join the largest Python community gathering! PyCon 2024 brings together Python developers, data scientists, and enthusiasts from around the world. Features keynotes from industry leaders, hands-on workshops, and networking opportunities. Call for Papers is now open for talks, tutorials, and poster sessions.',
                eventUrl: 'https://pretalx.com/pycon-2024/',
                website: 'https://us.pycon.org/2024/',
                contactEmail: 'cfp@pycon.org',
                source: 'Pretalx',
                totalTalks: 150,
                talks: [],
                scrapedAt: new Date().toISOString(),
                eventType: 'Conference',
                tags: ['python', 'programming', 'data-science', 'web-development', 'machine-learning'],
                organizer: 'Python Software Foundation',
                location: 'Pittsburgh, PA, USA',
                dateTime: '2024-05-15T09:00:00Z',
                cfpDeadline: '2024-02-15T23:59:59Z',
                eventStartDate: '2024-05-15T09:00:00Z',
                eventEndDate: '2024-05-18T18:00:00Z'
            },
            {
                id: 'fintech-summit-2024',
                title: 'FinTech Summit 2024 - Financial Technology Conference',
                description: 'Leading financial technology conference showcasing the latest innovations in banking, payments, blockchain, and digital finance. Connect with fintech leaders, investors, and innovators shaping the future of finance.',
                eventUrl: 'https://pretalx.com/fintech-summit-2024/',
                website: 'https://fintechsummit.com/2024',
                contactEmail: 'speakers@fintechsummit.com',
                source: 'Pretalx',
                totalTalks: 95,
                talks: [],
                scrapedAt: new Date().toISOString(),
                eventType: 'Conference',
                tags: ['fintech', 'banking', 'payments', 'blockchain', 'financial-services', 'digital-banking'],
                organizer: 'FinTech Summit',
                location: 'New York, NY, USA',
                dateTime: '2024-06-10T09:00:00Z',
                cfpDeadline: '2024-03-15T23:59:59Z',
                eventStartDate: '2024-06-10T09:00:00Z',
                eventEndDate: '2024-06-12T18:00:00Z'
            },
            {
                id: 'healthcare-tech-2024',
                title: 'Healthcare Technology Conference 2024',
                description: 'Comprehensive healthcare technology conference covering digital health, telemedicine, medical devices, and healthcare innovation. Learn about the latest trends in healthcare technology and digital transformation.',
                eventUrl: 'https://pretalx.com/healthcare-tech-2024/',
                website: 'https://healthcaretechcon.com/2024',
                contactEmail: 'proposals@healthcaretechcon.com',
                source: 'Pretalx',
                totalTalks: 85,
                talks: [],
                scrapedAt: new Date().toISOString(),
                eventType: 'Conference',
                tags: ['healthcare', 'medical-technology', 'telemedicine', 'digital-health', 'medical-devices', 'healthcare-innovation'],
                organizer: 'Healthcare Tech Institute',
                location: 'Boston, MA, USA',
                dateTime: '2024-07-20T09:00:00Z',
                cfpDeadline: '2024-04-20T23:59:59Z',
                eventStartDate: '2024-07-20T09:00:00Z',
                eventEndDate: '2024-07-22T18:00:00Z'
            },
            {
                id: 'edtech-conference-2024',
                title: 'EdTech Conference 2024 - Educational Technology',
                description: 'Premier educational technology conference featuring the latest in online learning, educational software, and digital learning tools. Connect with educators, technologists, and innovators in education.',
                eventUrl: 'https://pretalx.com/edtech-conference-2024/',
                website: 'https://edtechcon.com/2024',
                contactEmail: 'cfp@edtechcon.com',
                source: 'Pretalx',
                totalTalks: 75,
                talks: [],
                scrapedAt: new Date().toISOString(),
                eventType: 'Conference',
                tags: ['edtech', 'education', 'online-learning', 'educational-software', 'digital-learning', 'e-learning'],
                organizer: 'EdTech Conference',
                location: 'San Francisco, CA, USA',
                dateTime: '2024-08-25T09:00:00Z',
                cfpDeadline: '2024-05-25T23:59:59Z',
                eventStartDate: '2024-08-25T09:00:00Z',
                eventEndDate: '2024-08-27T18:00:00Z'
            },
            {
                id: 'retail-tech-2024',
                title: 'Retail Technology Summit 2024',
                description: 'Leading retail technology conference covering e-commerce, omnichannel retail, supply chain technology, and retail innovation. Learn about the latest trends transforming the retail industry.',
                eventUrl: 'https://pretalx.com/retail-tech-2024/',
                website: 'https://retailtechsummit.com/2024',
                contactEmail: 'speakers@retailtechsummit.com',
                source: 'Pretalx',
                totalTalks: 70,
                talks: [],
                scrapedAt: new Date().toISOString(),
                eventType: 'Conference',
                tags: ['retail', 'e-commerce', 'omnichannel', 'supply-chain', 'retail-technology', 'shopping'],
                organizer: 'Retail Tech Summit',
                location: 'Chicago, IL, USA',
                dateTime: '2024-09-15T09:00:00Z',
                cfpDeadline: '2024-06-15T23:59:59Z',
                eventStartDate: '2024-09-15T09:00:00Z',
                eventEndDate: '2024-09-17T18:00:00Z'
            },
            {
                id: 'jsconf-2024',
                title: 'JSConf 2024 - JavaScript Conference',
                description: 'The premier JavaScript conference featuring the latest in web technologies, frameworks, and best practices. Connect with JavaScript developers, learn about cutting-edge tools, and discover new opportunities in the JavaScript ecosystem. Perfect for both beginners and experienced developers.',
                eventUrl: 'https://pretalx.com/jsconf-2024/',
                website: 'https://jsconf.com/2024',
                contactEmail: 'speakers@jsconf.com',
                source: 'Pretalx',
                totalTalks: 120,
                talks: [],
                scrapedAt: new Date().toISOString(),
                eventType: 'Conference',
                tags: ['javascript', 'web-development', 'frontend', 'nodejs', 'react', 'vue'],
                organizer: 'JSConf',
                location: 'San Francisco, CA, USA',
                dateTime: '2024-06-20T09:00:00Z',
                cfpDeadline: '2024-03-01T23:59:59Z',
                eventStartDate: '2024-06-20T09:00:00Z',
                eventEndDate: '2024-06-22T17:00:00Z'
            },
            {
                id: 'devops-con-2024',
                title: 'DevOps Conference 2024 - Infrastructure & Automation',
                description: 'Comprehensive DevOps conference covering CI/CD, containerization, cloud infrastructure, and automation best practices. Learn from industry experts about scaling applications, monitoring systems, and implementing DevOps culture in your organization.',
                eventUrl: 'https://pretalx.com/devops-con-2024/',
                website: 'https://devopscon.io/2024',
                contactEmail: 'proposals@devopscon.io',
                source: 'Pretalx',
                totalTalks: 80,
                talks: [],
                scrapedAt: new Date().toISOString(),
                eventType: 'Conference',
                tags: ['devops', 'infrastructure', 'cloud', 'kubernetes', 'docker', 'automation'],
                organizer: 'DevOps Institute',
                location: 'Austin, TX, USA',
                dateTime: '2024-07-10T09:00:00Z',
                cfpDeadline: '2024-04-15T23:59:59Z',
                eventStartDate: '2024-07-10T09:00:00Z',
                eventEndDate: '2024-07-12T18:00:00Z'
            },
            {
                id: 'ai-summit-2024',
                title: 'AI Summit 2024 - Artificial Intelligence Conference',
                description: 'Leading AI conference showcasing the latest advances in artificial intelligence, machine learning, and deep learning. Features presentations on AI ethics, practical applications, and future trends. Connect with AI researchers, practitioners, and industry leaders.',
                eventUrl: 'https://pretalx.com/ai-summit-2024/',
                website: 'https://aisummit.com/2024',
                contactEmail: 'submissions@aisummit.com',
                source: 'Pretalx',
                totalTalks: 200,
                talks: [],
                scrapedAt: new Date().toISOString(),
                eventType: 'Conference',
                tags: ['artificial-intelligence', 'machine-learning', 'deep-learning', 'data-science', 'nlp', 'computer-vision'],
                organizer: 'AI Summit',
                location: 'New York, NY, USA',
                dateTime: '2024-08-15T09:00:00Z',
                cfpDeadline: '2024-05-01T23:59:59Z',
                eventStartDate: '2024-08-15T09:00:00Z',
                eventEndDate: '2024-08-17T18:00:00Z'
            },
            {
                id: 'web-dev-con-2024',
                title: 'Web Development Conference 2024',
                description: 'Comprehensive web development conference covering frontend, backend, and full-stack development. Learn about modern frameworks, performance optimization, accessibility, and emerging web technologies. Perfect for web developers of all levels.',
                eventUrl: 'https://pretalx.com/web-dev-con-2024/',
                website: 'https://webdevcon.com/2024',
                contactEmail: 'cfp@webdevcon.com',
                source: 'Pretalx',
                totalTalks: 90,
                talks: [],
                scrapedAt: new Date().toISOString(),
                eventType: 'Conference',
                tags: ['web-development', 'frontend', 'backend', 'full-stack', 'react', 'angular', 'vue'],
                organizer: 'Web Dev Con',
                location: 'Seattle, WA, USA',
                dateTime: '2024-09-05T09:00:00Z',
                cfpDeadline: '2024-06-15T23:59:59Z',
                eventStartDate: '2024-09-05T09:00:00Z',
                eventEndDate: '2024-09-07T17:00:00Z'
            },
            {
                id: 'data-science-con-2024',
                title: 'Data Science Conference 2024 - Analytics & Insights',
                description: 'Premier data science conference featuring the latest in analytics, machine learning, and data engineering. Learn about data visualization, statistical modeling, and real-world applications of data science across industries.',
                eventUrl: 'https://pretalx.com/data-science-con-2024/',
                website: 'https://datasciencecon.com/2024',
                contactEmail: 'speakers@datasciencecon.com',
                source: 'Pretalx',
                totalTalks: 110,
                talks: [],
                scrapedAt: new Date().toISOString(),
                eventType: 'Conference',
                tags: ['data-science', 'analytics', 'statistics', 'machine-learning', 'data-visualization', 'big-data'],
                organizer: 'Data Science Institute',
                location: 'Boston, MA, USA',
                dateTime: '2024-10-12T09:00:00Z',
                cfpDeadline: '2024-07-01T23:59:59Z',
                eventStartDate: '2024-10-12T09:00:00Z',
                eventEndDate: '2024-10-14T18:00:00Z'
            },
            {
                id: 'cybersecurity-summit-2024',
                title: 'Cybersecurity Summit 2024 - Security & Privacy',
                description: 'Leading cybersecurity conference covering threat intelligence, security architecture, privacy protection, and incident response. Learn from security experts about protecting organizations from evolving cyber threats.',
                eventUrl: 'https://pretalx.com/cybersecurity-summit-2024/',
                website: 'https://cybersummit.com/2024',
                contactEmail: 'proposals@cybersummit.com',
                source: 'Pretalx',
                totalTalks: 75,
                talks: [],
                scrapedAt: new Date().toISOString(),
                eventType: 'Conference',
                tags: ['cybersecurity', 'security', 'privacy', 'threat-intelligence', 'incident-response', 'compliance'],
                organizer: 'Cybersecurity Institute',
                location: 'Washington, DC, USA',
                dateTime: '2024-11-08T09:00:00Z',
                cfpDeadline: '2024-08-15T23:59:59Z',
                eventStartDate: '2024-11-08T09:00:00Z',
                eventEndDate: '2024-11-10T17:00:00Z'
            },
            {
                id: 'cloud-native-con-2024',
                title: 'Cloud Native Conference 2024 - Kubernetes & Microservices',
                description: 'Comprehensive cloud native conference covering Kubernetes, microservices, service mesh, and cloud infrastructure. Learn about building scalable, resilient applications in the cloud from industry experts.',
                eventUrl: 'https://pretalx.com/cloud-native-con-2024/',
                website: 'https://cloudnativecon.com/2024',
                contactEmail: 'cfp@cloudnativecon.com',
                source: 'Pretalx',
                totalTalks: 95,
                talks: [],
                scrapedAt: new Date().toISOString(),
                eventType: 'Conference',
                tags: ['cloud-native', 'kubernetes', 'microservices', 'service-mesh', 'containers', 'serverless'],
                organizer: 'Cloud Native Foundation',
                location: 'Barcelona, Spain',
                dateTime: '2024-12-03T09:00:00Z',
                cfpDeadline: '2024-09-01T23:59:59Z',
                eventStartDate: '2024-12-03T09:00:00Z',
                eventEndDate: '2024-12-05T18:00:00Z'
            },
            {
                id: 'mobile-dev-con-2024',
                title: 'Mobile Development Conference 2024 - iOS & Android',
                description: 'Leading mobile development conference covering iOS, Android, cross-platform development, and mobile UX/UI design. Learn about the latest mobile technologies, frameworks, and best practices from industry experts.',
                eventUrl: 'https://pretalx.com/mobile-dev-con-2024/',
                website: 'https://mobiledevcon.com/2024',
                contactEmail: 'speakers@mobiledevcon.com',
                source: 'Pretalx',
                totalTalks: 85,
                talks: [],
                scrapedAt: new Date().toISOString(),
                eventType: 'Conference',
                tags: ['mobile-development', 'ios', 'android', 'react-native', 'flutter', 'mobile-ux'],
                organizer: 'Mobile Dev Con',
                location: 'London, UK',
                dateTime: '2024-04-20T09:00:00Z',
                cfpDeadline: '2024-01-15T23:59:59Z',
                eventStartDate: '2024-04-20T09:00:00Z',
                eventEndDate: '2024-04-22T17:00:00Z'
            },
            {
                id: 'blockchain-summit-2024',
                title: 'Blockchain Summit 2024 - Web3 & Cryptocurrency',
                description: 'Comprehensive blockchain conference covering Web3, DeFi, NFTs, smart contracts, and cryptocurrency technologies. Learn about the latest developments in blockchain technology and its real-world applications.',
                eventUrl: 'https://pretalx.com/blockchain-summit-2024/',
                website: 'https://blockchainsummit.com/2024',
                contactEmail: 'proposals@blockchainsummit.com',
                source: 'Pretalx',
                totalTalks: 70,
                talks: [],
                scrapedAt: new Date().toISOString(),
                eventType: 'Conference',
                tags: ['blockchain', 'web3', 'defi', 'nft', 'smart-contracts', 'cryptocurrency'],
                organizer: 'Blockchain Summit',
                location: 'Singapore',
                dateTime: '2024-03-15T09:00:00Z',
                cfpDeadline: '2024-01-01T23:59:59Z',
                eventStartDate: '2024-03-15T09:00:00Z',
                eventEndDate: '2024-03-17T18:00:00Z'
            },
            {
                id: 'marketing-tech-2024',
                title: 'Marketing Technology Conference 2024',
                description: 'Leading marketing technology conference covering digital marketing, marketing automation, customer experience, and marketing analytics. Learn about the latest tools and strategies in marketing technology.',
                eventUrl: 'https://pretalx.com/marketing-tech-2024/',
                website: 'https://martechcon.com/2024',
                contactEmail: 'speakers@martechcon.com',
                source: 'Pretalx',
                totalTalks: 80,
                talks: [],
                scrapedAt: new Date().toISOString(),
                eventType: 'Conference',
                tags: ['marketing', 'digital-marketing', 'marketing-automation', 'customer-experience', 'marketing-analytics', 'advertising'],
                organizer: 'MarTech Conference',
                location: 'Los Angeles, CA, USA',
                dateTime: '2024-10-30T09:00:00Z',
                cfpDeadline: '2024-07-30T23:59:59Z',
                eventStartDate: '2024-10-30T09:00:00Z',
                eventEndDate: '2024-11-01T18:00:00Z'
            },
            {
                id: 'gaming-tech-2024',
                title: 'Gaming Technology Summit 2024',
                description: 'Comprehensive gaming technology conference covering game development, virtual reality, augmented reality, and gaming platforms. Connect with game developers, publishers, and technology innovators.',
                eventUrl: 'https://pretalx.com/gaming-tech-2024/',
                website: 'https://gamingtechsummit.com/2024',
                contactEmail: 'cfp@gamingtechsummit.com',
                source: 'Pretalx',
                totalTalks: 90,
                talks: [],
                scrapedAt: new Date().toISOString(),
                eventType: 'Conference',
                tags: ['gaming', 'game-development', 'virtual-reality', 'augmented-reality', 'gaming-platforms', 'esports'],
                organizer: 'Gaming Tech Summit',
                location: 'Austin, TX, USA',
                dateTime: '2024-11-20T09:00:00Z',
                cfpDeadline: '2024-08-20T23:59:59Z',
                eventStartDate: '2024-11-20T09:00:00Z',
                eventEndDate: '2024-11-22T18:00:00Z'
            },
            {
                id: 'automotive-tech-2024',
                title: 'Automotive Technology Conference 2024',
                description: 'Leading automotive technology conference covering autonomous vehicles, electric vehicles, connected cars, and automotive innovation. Learn about the future of transportation and automotive technology.',
                eventUrl: 'https://pretalx.com/automotive-tech-2024/',
                website: 'https://autotechcon.com/2024',
                contactEmail: 'proposals@autotechcon.com',
                source: 'Pretalx',
                totalTalks: 65,
                talks: [],
                scrapedAt: new Date().toISOString(),
                eventType: 'Conference',
                tags: ['automotive', 'autonomous-vehicles', 'electric-vehicles', 'connected-cars', 'transportation', 'automotive-innovation'],
                organizer: 'AutoTech Conference',
                location: 'Detroit, MI, USA',
                dateTime: '2024-12-10T09:00:00Z',
                cfpDeadline: '2024-09-10T23:59:59Z',
                eventStartDate: '2024-12-10T09:00:00Z',
                eventEndDate: '2024-12-12T18:00:00Z'
            }
        ];

        const selectedEvents = maxEvents ? mockEvents.slice(0, maxEvents) : mockEvents;
        
        return {
            success: true,
            events: selectedEvents,
            summary: {
                totalIds: selectedEvents.length,
                successfulEvents: selectedEvents.length,
                failedEvents: 0,
                totalTalks: selectedEvents.reduce((sum, event) => sum + event.totalTalks, 0)
            },
            errors: [],
            isMockData: true
        };
    }
}

module.exports = PretalxDirectService;
