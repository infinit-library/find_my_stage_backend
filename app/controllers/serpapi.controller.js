const axios = require('axios');

class SerpApiController {
  static async getSerpApiData(req, res) {
    console.log("req.body", req.body);
    try {
      const {
        query,
        industry,
        topic,
        location = 'United States',
        num = 10,
        engine = 'google',
        type = 'events'
      } = req.body;

      // Build query from parameters
      let searchQuery = query;
      if (!searchQuery && industry && topic) {
        searchQuery = `${industry} ${topic}`;
      } else if (!searchQuery && industry) {
        searchQuery = industry;
      } else if (!searchQuery && topic) {
        searchQuery = topic;
      }

      // Validate required parameters
      if (!searchQuery) {
        return res.status(400).json({
          success: false,
          message: 'Query parameter (or industry/topic combination) is required'
        });
      }

      // Check if SerpAPI key is configured
      const serpApiKey = process.env.SERPAPI_API_KEY;
      if (!serpApiKey) {
        console.log('SerpAPI key not configured, returning empty results');
        return res.json({
          success: true,
          message: 'SerpAPI key not configured - returning empty results',
          data: {
            events: [],
            total_results: 0,
            query: query,
            location: location,
            count: 0,
            source: 'SerpAPI (not configured)'
          }
        });
      }

      console.log(`🔍 Searching SerpAPI for events: "${searchQuery}" in ${location}`);

      // Build SerpAPI request parameters
      const serpApiParams = {
        q: searchQuery,
        location: location,
        num: Math.min(parseInt(num) || 50, 100), // Default to 50, max 100 results
        api_key: serpApiKey,
        engine: engine,
        google_domain: 'google.com',
        hl: 'en',
        gl: 'us'
      };

      // Add engine-specific parameters for better event results
      if (engine === 'google') {
        // Remove image search for regular event search - we want web results
        // serpApiParams.tbm = 'isch'; // This was causing image search instead of web results
        
        // Build a more flexible search query to get more results
        // Use broader search terms and remove time restrictions for more results
        const searchTerms = searchQuery.split(' ').filter(term => term.length > 2);
        const eventTerms = ['event', 'conference', 'summit', 'meeting', 'workshop', 'symposium', 'convention'];
        
        // Create a broader search query that includes event-related terms
        serpApiParams.q = `${searchQuery} ${eventTerms.join(' OR ')}`;
        
        // Remove time restriction to get more historical results (more events available)
        // serpApiParams.tbs = 'qdr:m'; // Comment out to get more results
        
        // Remove exact phrase matching to get more results
        // serpApiParams.as_epq = searchQuery; // Too restrictive
        // serpApiParams.as_oq = 'event conference summit meeting'; // Related terms
      }

      console.log('SerpAPI request params:', { ...serpApiParams, api_key: '[HIDDEN]' });

      // Make initial request to SerpAPI
      let response = await axios.get('https://serpapi.com/search', {
        params: serpApiParams,
        timeout: 30000 // 30 second timeout
      });

      let serpApiData = response.data;
      let allResults = [...(serpApiData.organic_results || [])];

      // Fetch additional pages if available (up to 5 pages total = ~50 results)
      const maxPages = 5;
      let currentPage = 1;
      
      // Fetch additional pages if available (up to 5 pages total = ~50 results)
      if (serpApiData.serpapi_pagination && serpApiData.serpapi_pagination.next_link) {
        
        while (currentPage < maxPages && serpApiData.serpapi_pagination && serpApiData.serpapi_pagination.next_link) {
          try {
            // Extract the next page URL from SerpAPI response
            const nextUrl = serpApiData.serpapi_pagination.next_link;
            
            // Add API key to the next URL since SerpAPI doesn't include it in pagination links
            const nextUrlWithKey = `${nextUrl}&api_key=${serpApiKey}`;
            
            // Make request to next page
            const nextResponse = await axios.get(nextUrlWithKey, {
              timeout: 30000
            });
            
            const nextPageData = nextResponse.data;
            
            // Add results from next page
            if (nextPageData.organic_results && Array.isArray(nextPageData.organic_results)) {
              allResults = [...allResults, ...nextPageData.organic_results];
            }
            
            serpApiData = nextPageData;
            currentPage++;
            
            // Small delay between requests to be respectful to SerpAPI
            await new Promise(resolve => setTimeout(resolve, 1000));
            
          } catch (pageError) {
            // Stop fetching more pages if there's an error
            break;
          }
        }
      }

      // Replace the original results with all collected results
      serpApiData.organic_results = allResults;
      serpApiData.total_results = allResults.length;
      
      // Pagination completed successfully

      // Process and format the results with image fetching
      let formattedEvents = [];
      
      if (serpApiData.organic_results && Array.isArray(serpApiData.organic_results)) {
        // Process events with image fetching (limit to first 20 for performance)
        const eventsToProcess = serpApiData.organic_results.slice(0, 20);
        
        formattedEvents = await Promise.all(eventsToProcess.map(async (result, index) => {
          // Extract organizer information from the display link
          const organizer = SerpApiController.extractOrganizerFromUrl(result.link || result.displayed_link || '');
          
          // Extract date information from snippet or title
          const extractedDate = SerpApiController.extractDateFromText(result.snippet || result.title || '');
          
          // Extract location information from snippet
          const extractedLocation = SerpApiController.extractLocationFromText(result.snippet || '');
          
          // Extract basic enhanced details (simplified approach)
          const enhancedDetails = {
            eventType: SerpApiController.detectEventType(result.title || result.snippet || ''),
            eventCategory: SerpApiController.extractEventCategory(`${result.title || ''} ${result.snippet || ''}`.toLowerCase()),
            isVirtual: SerpApiController.isVirtualEvent(`${result.title || ''} ${result.snippet || ''}`.toLowerCase()),
            isFree: SerpApiController.isFreeEvent(`${result.title || ''} ${result.snippet || ''}`.toLowerCase()),
            topics: SerpApiController.extractEventTopics(`${result.title || ''} ${result.snippet || ''}`.toLowerCase()),
            targetAudience: SerpApiController.extractTargetAudience(`${result.title || ''} ${result.snippet || ''}`.toLowerCase()),
            hasKeynotes: SerpApiController.hasKeynotes(`${result.title || ''} ${result.snippet || ''}`.toLowerCase()),
            hasWorkshops: SerpApiController.hasWorkshops(`${result.title || ''} ${result.snippet || ''}`.toLowerCase()),
            hasExhibition: SerpApiController.hasExhibition(`${result.title || ''} ${result.snippet || ''}`.toLowerCase()),
            networkingOpportunities: SerpApiController.hasNetworking(`${result.title || ''} ${result.snippet || ''}`.toLowerCase()),
            tags: SerpApiController.extractEventTags(`${result.title || ''} ${result.snippet || ''}`.toLowerCase())
          };
          
          // Fetch event-specific image
          let eventImage = null;
          if (result.title) {
            eventImage = await SerpApiController.fetchEventImage(result.title, result.link, serpApiKey);
          }
          
          return {
            id: `serpapi_${index}`,
            title: result.title || 'No title available',
            description: result.snippet || 'No description available',
            url: result.link || '',
            source: 'SerpAPI',
            position: result.position || index + 1,
            
            // Basic Information
            date: result.date || extractedDate || null,
            location: extractedLocation || null,
            organizer: organizer || null,
            contactInfo: SerpApiController.extractContactInfo(result.snippet || result.title || ''),
            
            // Enhanced Event Details
            eventDetails: enhancedDetails,
            
            scrapedAt: new Date().toISOString(),
            metadata: {
              displayLink: result.displayed_link || '',
              thumbnail: eventImage?.thumbnail || result.thumbnail || null,
              favicon: result.favicon || null,
              siteName: SerpApiController.extractSiteName(result.displayed_link || ''),
              eventType: enhancedDetails.eventType,
              imageInfo: eventImage ? {
                original: eventImage.original,
                title: eventImage.title,
                source: eventImage.source
              } : null
            }
          };
        }));
        
        // Add remaining events without image fetching for performance
        if (serpApiData.organic_results.length > 20) {
          const remainingEvents = serpApiData.organic_results.slice(20).map((result, index) => {
            const organizer = SerpApiController.extractOrganizerFromUrl(result.link || result.displayed_link || '');
            const extractedDate = SerpApiController.extractDateFromText(result.snippet || result.title || '');
            const extractedLocation = SerpApiController.extractLocationFromText(result.snippet || '');
            
            // Extract basic enhanced details for remaining events too
            const enhancedDetails = {
              eventType: SerpApiController.detectEventType(result.title || result.snippet || ''),
              eventCategory: SerpApiController.extractEventCategory(`${result.title || ''} ${result.snippet || ''}`.toLowerCase()),
              isVirtual: SerpApiController.isVirtualEvent(`${result.title || ''} ${result.snippet || ''}`.toLowerCase()),
              isFree: SerpApiController.isFreeEvent(`${result.title || ''} ${result.snippet || ''}`.toLowerCase()),
              topics: SerpApiController.extractEventTopics(`${result.title || ''} ${result.snippet || ''}`.toLowerCase()),
              targetAudience: SerpApiController.extractTargetAudience(`${result.title || ''} ${result.snippet || ''}`.toLowerCase()),
              hasKeynotes: SerpApiController.hasKeynotes(`${result.title || ''} ${result.snippet || ''}`.toLowerCase()),
              hasWorkshops: SerpApiController.hasWorkshops(`${result.title || ''} ${result.snippet || ''}`.toLowerCase()),
              hasExhibition: SerpApiController.hasExhibition(`${result.title || ''} ${result.snippet || ''}`.toLowerCase()),
              networkingOpportunities: SerpApiController.hasNetworking(`${result.title || ''} ${result.snippet || ''}`.toLowerCase()),
              tags: SerpApiController.extractEventTags(`${result.title || ''} ${result.snippet || ''}`.toLowerCase())
            };
            
            return {
              id: `serpapi_${index + 20}`,
              title: result.title || 'No title available',
              description: result.snippet || 'No description available',
              url: result.link || '',
              source: 'SerpAPI',
              position: result.position || index + 21,
              
              // Basic Information
              date: result.date || extractedDate || null,
              location: extractedLocation || null,
              organizer: organizer || null,
              contactInfo: SerpApiController.extractContactInfo(result.snippet || result.title || ''),
              
              // Enhanced Event Details
              eventDetails: enhancedDetails,
              
              scrapedAt: new Date().toISOString(),
              metadata: {
                displayLink: result.displayed_link || '',
                thumbnail: result.thumbnail || null,
                favicon: result.favicon || null,
                siteName: SerpApiController.extractSiteName(result.displayed_link || ''),
                eventType: enhancedDetails.eventType
              }
            };
          });
          
          formattedEvents = [...formattedEvents, ...remainingEvents];
        }
      }

      // Handle different result types based on search engine
      if (engine === 'google_events' && serpApiData.events_results) {
        formattedEvents = serpApiData.events_results.map((event, index) => {
          // Extract contact information from event description
          const contactInfo = SerpApiController.extractContactInfo(event.description || event.title || '');
          
          return {
            id: `serpapi_event_${index}`,
            title: event.title || 'No title available',
            description: event.description || 'No description available',
            date: event.date || null,
            location: event.address || null,
            organizer: event.venue || null, // Venue often contains organizer info
            contactInfo: contactInfo,
            url: event.link || '',
            source: 'SerpAPI Google Events',
            scrapedAt: new Date().toISOString(),
            metadata: {
              venue: event.venue || null,
              ticketInfo: event.ticket_info || null,
              thumbnail: event.thumbnail || null,
              eventType: SerpApiController.detectEventType(event.title || event.description || ''),
              siteName: SerpApiController.extractSiteName(event.link || ''),
              price: event.price || null,
              rating: event.rating || null
            }
          };
        });
      }

      res.json({
        success: true,
        message: `Successfully retrieved ${formattedEvents.length} results from SerpAPI`,
        data: {
          events: formattedEvents,
          total_results: formattedEvents.length,
          query: searchQuery,
          originalQuery: query,
          industry: industry,
          topic: topic,
          location: location,
          count: formattedEvents.length,
          source: `SerpAPI (${engine})`,
          searchInfo: {
            engine: engine,
            num_requested: parseInt(num) || 10,
            search_time: serpApiData.search_metadata?.total_time_taken || null,
            serpapi_pagination: serpApiData.serpapi_pagination || null
          },
          raw_data: process.env.NODE_ENV === 'development' ? serpApiData : undefined
        }
      });

    } catch (error) {
      console.error('SerpAPI search error:', error);

      // Handle specific SerpAPI errors
      if (error.response) {
        const statusCode = error.response.status;
        const errorMessage = error.response.data?.error || error.message;

        if (statusCode === 401) {
          return res.status(401).json({
            success: false,
            message: 'Invalid SerpAPI key',
            error: 'Authentication failed'
          });
        }

        if (statusCode === 429) {
          return res.status(429).json({
            success: false,
            message: 'SerpAPI rate limit exceeded',
            error: 'Too many requests'
          });
        }

        if (statusCode === 400) {
          return res.status(400).json({
            success: false,
            message: 'Invalid SerpAPI request parameters',
            error: errorMessage
          });
        }

        return res.status(statusCode).json({
          success: false,
          message: 'SerpAPI request failed',
          error: errorMessage
        });
      }

      // Handle network/timeout errors
      if (error.code === 'ECONNABORTED') {
        return res.status(408).json({
          success: false,
          message: 'SerpAPI request timeout',
          error: 'Request took too long to complete'
        });
      }

      // Generic error handling
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get detailed event information including contact details
   * This method can be called separately to get more detailed info
   */
  static async getDetailedEventInfo(req, res) {
    try {
      const { eventUrl, eventTitle } = req.body;

      if (!eventUrl && !eventTitle) {
        return res.status(400).json({
          success: false,
          message: 'Event URL or title is required'
        });
      }

      const serpApiKey = process.env.SERPAPI_API_KEY;
      if (!serpApiKey) {
        return res.json({
          success: true,
          message: 'SerpAPI key not configured',
          data: {
            detailedInfo: null,
            contactInfo: { email: null, phone: null, website: null },
            source: 'SerpAPI (not configured)'
          }
        });
      }

      console.log(`🔍 Getting detailed info for: ${eventTitle || eventUrl}`);

      // Search for detailed information about the event
      const searchQuery = eventTitle || eventUrl;
      const serpApiParams = {
        q: `${searchQuery} contact email phone organizer`,
        num: 5,
        api_key: serpApiKey,
        engine: 'google',
        hl: 'en',
        gl: 'us'
      };

      const response = await axios.get('https://serpapi.com/search', {
        params: serpApiParams,
        timeout: 30000
      });

      const serpApiData = response.data;
      let contactInfo = { email: null, phone: null, website: null };

      // Extract contact info from all results
      if (serpApiData.organic_results && Array.isArray(serpApiData.organic_results)) {
        for (const result of serpApiData.organic_results) {
          const extractedContact = SerpApiController.extractContactInfo(
            `${result.title || ''} ${result.snippet || ''}`
          );
          
          if (extractedContact.email && !contactInfo.email) {
            contactInfo.email = extractedContact.email;
          }
          if (extractedContact.phone && !contactInfo.phone) {
            contactInfo.phone = extractedContact.phone;
          }
          if (extractedContact.website && !contactInfo.website) {
            contactInfo.website = extractedContact.website;
          }
        }
      }

      res.json({
        success: true,
        message: 'Detailed event information retrieved successfully',
        data: {
          eventUrl: eventUrl,
          eventTitle: eventTitle,
          contactInfo: contactInfo,
          source: 'SerpAPI Detailed Search',
          searchResults: serpApiData.organic_results ? serpApiData.organic_results.slice(0, 3) : []
        }
      });

    } catch (error) {
      console.error('Detailed event info error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  static async getSerpApiImages(req, res) {
    try {
      const {
        query,
        num = 10,
        location = 'United States'
      } = req.body;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Query parameter is required'
        });
      }

      const serpApiKey = process.env.SERPAPI_API_KEY;
      if (!serpApiKey) {
        return res.json({
          success: true,
          message: 'SerpAPI key not configured',
          data: {
            images: [],
            total_results: 0,
            query: query,
            count: 0,
            source: 'SerpAPI Images (not configured)'
          }
        });
      }

      console.log(`🖼️ Searching SerpAPI for images: "${query}"`);

      const serpApiParams = {
        q: query,
        location: location,
        num: Math.min(parseInt(num) || 10, 20), // Limit images to 20
        api_key: serpApiKey,
        engine: 'google',
        tbm: 'isch', // Image search
        hl: 'en',
        gl: 'us'
      };

      const response = await axios.get('https://serpapi.com/search', {
        params: serpApiParams,
        timeout: 30000
      });

      const serpApiData = response.data;
      let formattedImages = [];

      if (serpApiData.images_results && Array.isArray(serpApiData.images_results)) {
        formattedImages = serpApiData.images_results.map((image, index) => ({
          id: `serpapi_img_${index}`,
          title: image.title || 'No title available',
          thumbnail: image.thumbnail || '',
          original: image.original || '',
          source: image.source || '',
          link: image.link || '',
          position: index + 1,
          scrapedAt: new Date().toISOString()
        }));
      }

      res.json({
        success: true,
        message: `Successfully retrieved ${formattedImages.length} images from SerpAPI`,
        data: {
          images: formattedImages,
          total_results: formattedImages.length,
          query: query,
          count: formattedImages.length,
          source: 'SerpAPI Images'
        }
      });

    } catch (error) {
      console.error('SerpAPI images search error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  static async getSerpApiNews(req, res) {
    try {
      const {
        query,
        num = 10,
        location = 'United States',
        time_period = 'm' // past month
      } = req.body;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Query parameter is required'
        });
      }

      const serpApiKey = process.env.SERPAPI_API_KEY;
      if (!serpApiKey) {
        return res.json({
          success: true,
          message: 'SerpAPI key not configured',
          data: {
            news: [],
            total_results: 0,
            query: query,
            count: 0,
            source: 'SerpAPI News (not configured)'
          }
        });
      }

      console.log(`📰 Searching SerpAPI for news: "${query}"`);

      const serpApiParams = {
        q: query,
        location: location,
        num: Math.min(parseInt(num) || 10, 100),
        api_key: serpApiKey,
        engine: 'google',
        tbm: 'nws', // News search
        tbs: `qdr:${time_period}`, // Time period
        hl: 'en',
        gl: 'us'
      };

      const response = await axios.get('https://serpapi.com/search', {
        params: serpApiParams,
        timeout: 30000
      });

      const serpApiData = response.data;
      let formattedNews = [];

      if (serpApiData.news_results && Array.isArray(serpApiData.news_results)) {
        formattedNews = serpApiData.news_results.map((news, index) => ({
          id: `serpapi_news_${index}`,
          title: news.title || 'No title available',
          snippet: news.snippet || 'No description available',
          link: news.link || '',
          date: news.date || null,
          source: news.source || 'Unknown source',
          position: index + 1,
          scrapedAt: new Date().toISOString(),
          metadata: {
            thumbnail: news.thumbnail || null,
            sourceUrl: news.source_url || null
          }
        }));
      }

      res.json({
        success: true,
        message: `Successfully retrieved ${formattedNews.length} news articles from SerpAPI`,
        data: {
          news: formattedNews,
          total_results: formattedNews.length,
          query: query,
          count: formattedNews.length,
          source: 'SerpAPI News',
          searchInfo: {
            time_period: time_period,
            location: location
          }
        }
      });

    } catch (error) {
      console.error('SerpAPI news search error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Extract organizer information from URL
   */
  static extractOrganizerFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      // Remove common prefixes
      const cleanHostname = hostname
        .replace(/^www\./, '')
        .replace(/\.(com|org|net|edu|gov|co\.uk|de|fr|ca)$/, '');
      
      // Format as organizer name
      return cleanHostname
        .split('.')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract date information from text
   */
  static extractDateFromText(text) {
    if (!text) return null;
    
    // Common date patterns
    const datePatterns = [
      /(\d{1,2}\/\d{1,2}\/\d{4})/g, // MM/DD/YYYY
      /(\d{4}-\d{2}-\d{2})/g, // YYYY-MM-DD
      /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/gi,
      /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}/gi,
      /(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/gi
    ];
    
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }
    
    return null;
  }

  /**
   * Extract location information from text
   */
  static extractLocationFromText(text) {
    if (!text) return null;
    
    // Common location patterns
    const locationPatterns = [
      /in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
      /at\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
      /([A-Z][a-z]+,\s*[A-Z]{2})/g, // City, State
      /([A-Z][a-z]+,\s*[A-Z][a-z]+)/g, // City, Country
      /(Virtual|Online|Remote)/gi
    ];
    
    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }
    
    return null;
  }

  /**
   * Extract site name from URL
   */
  static extractSiteName(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch (error) {
      return null;
    }
  }

  /**
   * Detect event type from title or description
   */
  static detectEventType(text) {
    if (!text) return 'Event';
    
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('conference')) return 'Conference';
    if (lowerText.includes('summit')) return 'Summit';
    if (lowerText.includes('workshop')) return 'Workshop';
    if (lowerText.includes('seminar')) return 'Seminar';
    if (lowerText.includes('meeting')) return 'Meeting';
    if (lowerText.includes('webinar')) return 'Webinar';
    if (lowerText.includes('symposium')) return 'Symposium';
    if (lowerText.includes('exhibition')) return 'Exhibition';
    if (lowerText.includes('trade show')) return 'Trade Show';
    if (lowerText.includes('expo')) return 'Expo';
    
    return 'Event';
  }

  /**
   * Extract contact information (email and phone) from text
   */
  static extractContactInfo(text) {
    if (!text) return { email: null, phone: null, website: null };

    const contactInfo = {
      email: null,
      phone: null,
      website: null
    };

    // Extract email addresses
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = text.match(emailPattern);
    if (emails && emails.length > 0) {
      contactInfo.email = emails[0]; // Take the first email found
    }

    // Extract phone numbers (various formats)
    const phonePatterns = [
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // 123-456-7890, 123.456.7890, 1234567890
      /\b\(\d{3}\)\s*\d{3}[-.]?\d{4}\b/g, // (123) 456-7890, (123)456-7890
      /\b\d{3}\s+\d{3}\s+\d{4}\b/g, // 123 456 7890
      /\+\d{1,3}\s*\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // +1 123-456-7890
      /\b\d{3}[-.]?\d{4}[-.]?\d{4}\b/g // International format
    ];

    for (const pattern of phonePatterns) {
      const phones = text.match(pattern);
      if (phones && phones.length > 0) {
        contactInfo.phone = phones[0]; // Take the first phone found
        break;
      }
    }

    // Extract website URLs
    const websitePattern = /\b(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?\b/g;
    const websites = text.match(websitePattern);
    if (websites && websites.length > 0) {
      // Filter out common non-contact websites
      const filteredWebsites = websites.filter(site => 
        !site.includes('google.com') && 
        !site.includes('facebook.com') && 
        !site.includes('twitter.com') &&
        !site.includes('linkedin.com') &&
        !site.includes('youtube.com') &&
        site.length > 10 // Basic length filter
      );
      
      if (filteredWebsites.length > 0) {
        contactInfo.website = filteredWebsites[0];
      }
    }

    return contactInfo;
  }

  /**
   * Fetch event-specific images from SerpAPI
   */
  static async fetchEventImage(eventTitle, eventUrl, serpApiKey) {
    try {
      // Create a specific search query for this event
      const imageQuery = `${eventTitle} conference event logo banner`;
      
      const imageParams = {
        q: imageQuery,
        num: 5, // Get top 5 images
        api_key: serpApiKey,
        engine: 'google',
        tbm: 'isch', // Image search
        safe: 'active',
        hl: 'en',
        gl: 'us'
      };

      const response = await axios.get('https://serpapi.com/search', {
        params: imageParams,
        timeout: 10000 // 10 second timeout for image search
      });

      const imageData = response.data;
      
      if (imageData.images_results && imageData.images_results.length > 0) {
        // Return the first (most relevant) image
        const bestImage = imageData.images_results[0];
        return {
          thumbnail: bestImage.thumbnail,
          original: bestImage.original,
          title: bestImage.title,
          source: bestImage.source
        };
      }
      
      return null;
    } catch (error) {
      console.log(`Failed to fetch image for event: ${eventTitle}`, error.message);
      return null;
    }
  }

  /**
   * Extract comprehensive event details from text
   */
  static extractComprehensiveEventDetails(title, snippet, url) {
    const fullText = `${title || ''} ${snippet || ''}`.toLowerCase();
    
    return {
      // Event Type Detection
      eventType: SerpApiController.detectEventType(title || snippet || ''),
      eventCategory: SerpApiController.extractEventCategory(fullText),
      
      // Date and Time Information
      date: SerpApiController.extractDateFromText(snippet || title || ''),
      duration: SerpApiController.extractEventDuration(fullText),
      timezone: SerpApiController.extractTimezone(fullText),
      
      // Location Information
      location: SerpApiController.extractLocationFromText(snippet || ''),
      venue: SerpApiController.extractVenueDetails(fullText),
      address: SerpApiController.extractAddress(fullText),
      city: SerpApiController.extractCity(fullText),
      country: SerpApiController.extractCountry(fullText),
      isVirtual: SerpApiController.isVirtualEvent(fullText),
      
      // Pricing Information
      pricing: SerpApiController.extractPricingInfo(fullText),
      isFree: SerpApiController.isFreeEvent(fullText),
      
      // Registration Information
      registrationRequired: SerpApiController.requiresRegistration(fullText),
      registrationDeadline: SerpApiController.extractRegistrationDeadline(fullText),
      capacity: SerpApiController.extractEventCapacity(fullText),
      
      // Event Content
      topics: SerpApiController.extractEventTopics(fullText),
      targetAudience: SerpApiController.extractTargetAudience(fullText),
      speakers: SerpApiController.extractSpeakerInfo(fullText),
      agenda: SerpApiController.extractAgendaInfo(fullText),
      
      // Contact and Organization
      organizer: SerpApiController.extractOrganizerFromUrl(url || ''),
      contactInfo: SerpApiController.extractContactInfo(snippet || title || ''),
      website: SerpApiController.extractMainWebsite(url || snippet || ''),
      
      // Technical Details
      format: SerpApiController.extractEventFormat(fullText),
      language: SerpApiController.extractEventLanguage(fullText),
      cpdCredits: SerpApiController.extractCPDCredits(fullText),
      
      // Social and Networking
      networkingOpportunities: SerpApiController.hasNetworking(fullText),
      socialMedia: SerpApiController.extractSocialMedia(fullText),
      
      // Additional Features
      hasExhibition: SerpApiController.hasExhibition(fullText),
      hasWorkshops: SerpApiController.hasWorkshops(fullText),
      hasKeynotes: SerpApiController.hasKeynotes(fullText),
      hasPanelDiscussion: SerpApiController.hasPanelDiscussion(fullText),
      
      // Accessibility
      accessibility: SerpApiController.extractAccessibilityInfo(fullText),
      
      // Tags and Keywords
      tags: SerpApiController.extractEventTags(fullText),
      keywords: SerpApiController.extractKeywords(fullText)
    };
  }

  /**
   * Extract event category (e.g., Technology, Healthcare, Education)
   */
  static extractEventCategory(text) {
    const categories = {
      'technology': ['tech', 'software', 'ai', 'artificial intelligence', 'machine learning', 'cybersecurity', 'cloud', 'blockchain'],
      'healthcare': ['health', 'medical', 'healthcare', 'medicine', 'clinical', 'pharmaceutical'],
      'education': ['education', 'learning', 'training', 'academic', 'university', 'school', 'edtech'],
      'business': ['business', 'marketing', 'finance', 'startup', 'entrepreneurship', 'leadership'],
      'science': ['science', 'research', 'innovation', 'scientific', 'laboratory', 'discovery'],
      'arts': ['art', 'creative', 'design', 'music', 'culture', 'entertainment'],
      'environment': ['environment', 'sustainability', 'climate', 'green', 'renewable', 'energy']
    };
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category.charAt(0).toUpperCase() + category.slice(1);
      }
    }
    return 'General';
  }

  /**
   * Extract event duration
   */
  static extractEventDuration(text) {
    const durationPatterns = [
      /(\d+)\s*(?:day|days)/gi,
      /(\d+)\s*(?:hour|hours|hr|hrs)/gi,
      /(\d+)\s*(?:week|weeks)/gi,
      /(\d+)\s*(?:month|months)/gi,
      /(\d+)\s*(?:session|sessions)/gi
    ];
    
    for (const pattern of durationPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }
    return null;
  }

  /**
   * Extract timezone information
   */
  static extractTimezone(text) {
    const timezonePatterns = [
      /(?:UTC|GMT)([+-]\d+)/gi,
      /(?:EST|EDT|CST|CDT|MST|MDT|PST|PDT)/gi,
      /(?:timezone|time zone)[:\s]+([A-Za-z\/\s]+)/gi
    ];
    
    for (const pattern of timezonePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }
    return null;
  }

  /**
   * Extract venue details
   */
  static extractVenueDetails(text) {
    const venuePatterns = [
      /(?:venue|location)[:\s]+([A-Za-z0-9\s,.-]+?)(?:\s|$|,|\.)/gi,
      /at\s+([A-Za-z0-9\s,.-]+?)(?:\s|$|,|\.)/gi,
      /held\s+at\s+([A-Za-z0-9\s,.-]+?)(?:\s|$|,|\.)/gi
    ];
    
    for (const pattern of venuePatterns) {
      const match = text.match(pattern);
      if (match && match[1].length > 3) {
        return match[1].trim();
      }
    }
    return null;
  }

  /**
   * Extract address information
   */
  static extractAddress(text) {
    const addressPattern = /\d+\s+[A-Za-z0-9\s,.-]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr)/gi;
    const match = text.match(addressPattern);
    return match ? match[0] : null;
  }

  /**
   * Extract city information
   */
  static extractCity(text) {
    const cityPatterns = [
      /in\s+([A-Za-z\s]+?)(?:,|$|\s|\.)/gi,
      /([A-Za-z\s]+?),\s*[A-Z]{2}/gi, // City, State format
      /([A-Za-z\s]+?),\s*[A-Za-z\s]+/gi // City, Country format
    ];
    
    for (const pattern of cityPatterns) {
      const match = text.match(pattern);
      if (match && match[1].length > 2 && match[1].length < 50) {
        return match[1].trim();
      }
    }
    return null;
  }

  /**
   * Extract country information
   */
  static extractCountry(text) {
    const countries = ['usa', 'united states', 'canada', 'uk', 'united kingdom', 'australia', 'germany', 'france', 'spain', 'italy', 'japan', 'china', 'india', 'brazil'];
    for (const country of countries) {
      if (text.includes(country)) {
        return country.charAt(0).toUpperCase() + country.slice(1);
      }
    }
    return null;
  }

  /**
   * Check if event is virtual
   */
  static isVirtualEvent(text) {
    const virtualKeywords = ['virtual', 'online', 'webinar', 'zoom', 'teams', 'live stream', 'streaming', 'digital'];
    return virtualKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Extract pricing information
   */
  static extractPricingInfo(text) {
    if (!text) return null;
    
    const pricePatterns = [
      /\$(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:dollars?|usd)/gi,
      /(?:price|cost|fee)[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      /(?:early bird|early registration)[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      /(?:student|member)[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi
    ];
    
    const prices = [];
    for (const pattern of pricePatterns) {
      try {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          if (match[1] && parseFloat(match[1].replace(/,/g, '')) > 0) {
            prices.push(`$${match[1]}`);
          }
        }
      } catch (error) {
        // Skip this pattern if there's an error
        continue;
      }
    }
    return prices.length > 0 ? prices : null;
  }

  /**
   * Check if event is free
   */
  static isFreeEvent(text) {
    const freeKeywords = ['free', 'no cost', 'complimentary', 'gratis', 'no charge', 'zero cost'];
    return freeKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Check if registration is required
   */
  static requiresRegistration(text) {
    const regKeywords = ['register', 'registration', 'rsvp', 'sign up', 'book', 'reserve'];
    return regKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Extract registration deadline
   */
  static extractRegistrationDeadline(text) {
    const deadlinePatterns = [
      /(?:deadline|due)[:\s]+([A-Za-z0-9\s,.-]+?)(?:\s|$|,|\.)/gi,
      /(?:register|registration)\s+(?:by|before)[:\s]+([A-Za-z0-9\s,.-]+?)(?:\s|$|,|\.)/gi
    ];
    
    for (const pattern of deadlinePatterns) {
      const match = text.match(pattern);
      if (match && match[1].length > 5) {
        return match[1].trim();
      }
    }
    return null;
  }

  /**
   * Extract event capacity
   */
  static extractEventCapacity(text) {
    const capacityPatterns = [
      /(?:capacity|limit|max)[:\s]*(\d+(?:,\d{3})*)/gi,
      /(?:seats|spots)[:\s]*(\d+(?:,\d{3})*)/gi,
      /(?:up to|maximum)\s+(\d+(?:,\d{3})*)/gi
    ];
    
    for (const pattern of capacityPatterns) {
      const match = text.match(pattern);
      if (match && parseInt(match[1].replace(/,/g, '')) > 0) {
        return parseInt(match[1].replace(/,/g, ''));
      }
    }
    return null;
  }

  /**
   * Extract event topics
   */
  static extractEventTopics(text) {
    const commonTopics = [
      'artificial intelligence', 'machine learning', 'data science', 'cloud computing',
      'cybersecurity', 'blockchain', 'digital transformation', 'automation',
      'sustainability', 'innovation', 'leadership', 'marketing', 'sales',
      'finance', 'healthcare technology', 'education technology', 'research',
      'networking', 'startup', 'entrepreneurship', 'product management'
    ];
    
    const foundTopics = [];
    for (const topic of commonTopics) {
      if (text.includes(topic)) {
        foundTopics.push(topic);
      }
    }
    return foundTopics.length > 0 ? foundTopics : null;
  }

  /**
   * Extract target audience
   */
  static extractTargetAudience(text) {
    const audiences = [
      'students', 'professionals', 'executives', 'researchers', 'academics',
      'developers', 'engineers', 'managers', 'entrepreneurs', 'investors',
      'educators', 'healthcare professionals', 'marketers', 'sales teams',
      'ceo', 'cto', 'cfo', 'startup founders', 'consultants'
    ];
    
    const foundAudiences = [];
    for (const audience of audiences) {
      if (text.includes(audience)) {
        foundAudiences.push(audience);
      }
    }
    return foundAudiences.length > 0 ? foundAudiences : null;
  }

  /**
   * Extract speaker information
   */
  static extractSpeakerInfo(text) {
    if (!text) return null;
    
    const speakerPatterns = [
      /(?:keynote|speaker)[:\s]+([A-Za-z\s,.-]+?)(?:\s|$|,|\.)/gi,
      /(?:featuring|presented by)[:\s]+([A-Za-z\s,.-]+?)(?:\s|$|,|\.)/gi,
      /(?:expert|panelist)[:\s]+([A-Za-z\s,.-]+?)(?:\s|$|,|\.)/gi
    ];
    
    const speakers = [];
    for (const pattern of speakerPatterns) {
      try {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          if (match[1] && match[1].length > 3 && match[1].length < 100) {
            speakers.push(match[1].trim());
          }
        }
      } catch (error) {
        continue;
      }
    }
    return speakers.length > 0 ? speakers : null;
  }

  /**
   * Extract agenda information
   */
  static extractAgendaInfo(text) {
    if (!text) return null;
    
    const agendaPatterns = [
      /(?:agenda|schedule|program)[:\s]+([A-Za-z0-9\s,.-]+?)(?:\s|$|,|\.)/gi,
      /(?:session|workshop)[:\s]+([A-Za-z0-9\s,.-]+?)(?:\s|$|,|\.)/gi,
      /(?:track|theme)[:\s]+([A-Za-z0-9\s,.-]+?)(?:\s|$|,|\.)/gi
    ];
    
    const agendaItems = [];
    for (const pattern of agendaPatterns) {
      try {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          if (match[1] && match[1].length > 3 && match[1].length < 100) {
            agendaItems.push(match[1].trim());
          }
        }
      } catch (error) {
        continue;
      }
    }
    return agendaItems.length > 0 ? agendaItems : null;
  }

  /**
   * Extract main website
   */
  static extractMainWebsite(text) {
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlPattern);
    if (matches && matches.length > 0) {
      return matches[0];
    }
    return null;
  }

  /**
   * Extract event format
   */
  static extractEventFormat(text) {
    const formats = {
      'conference': ['conference', 'summit', 'symposium'],
      'workshop': ['workshop', 'training', 'hands-on'],
      'webinar': ['webinar', 'online', 'virtual'],
      'meeting': ['meeting', 'gathering', 'assembly'],
      'exhibition': ['exhibition', 'expo', 'trade show'],
      'seminar': ['seminar', 'presentation', 'lecture']
    };
    
    for (const [format, keywords] of Object.entries(formats)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return format;
      }
    }
    return 'event';
  }

  /**
   * Extract event language
   */
  static extractEventLanguage(text) {
    const languages = ['english', 'spanish', 'french', 'german', 'chinese', 'japanese', 'multilingual'];
    for (const lang of languages) {
      if (text.includes(lang)) {
        return lang;
      }
    }
    return 'english'; // Default assumption
  }

  /**
   * Extract CPD/CE credits information
   */
  static extractCPDCredits(text) {
    const creditPatterns = [
      /(?:cpd|ce|continuing education)[:\s]*(\d+(?:\.\d+)?)/gi,
      /(\d+(?:\.\d+)?)\s*(?:cpd|ce|credits?)/gi,
      /(?:professional development|pd)[:\s]*(\d+(?:\.\d+)?)/gi
    ];
    
    for (const pattern of creditPatterns) {
      const match = text.match(pattern);
      if (match && parseFloat(match[1]) > 0) {
        return parseFloat(match[1]);
      }
    }
    return null;
  }

  /**
   * Check for networking opportunities
   */
  static hasNetworking(text) {
    const networkingKeywords = ['networking', 'mixer', 'social', 'reception', 'cocktail', 'dinner'];
    return networkingKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Extract social media information
   */
  static extractSocialMedia(text) {
    if (!text) return null;
    
    const socialPatterns = [
      /@([A-Za-z0-9_]+)/g, // Twitter handles
      /#([A-Za-z0-9_]+)/g, // Hashtags
      /(?:follow|connect)[:\s]+@([A-Za-z0-9_]+)/g
    ];
    
    const socialMedia = [];
    for (const pattern of socialPatterns) {
      try {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          socialMedia.push(`@${match[1]}`);
        }
      } catch (error) {
        continue;
      }
    }
    return socialMedia.length > 0 ? socialMedia : null;
  }

  /**
   * Check for exhibition
   */
  static hasExhibition(text) {
    const exhibitionKeywords = ['exhibition', 'expo', 'booth', 'vendor', 'sponsor', 'trade show'];
    return exhibitionKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Check for workshops
   */
  static hasWorkshops(text) {
    const workshopKeywords = ['workshop', 'hands-on', 'training', 'lab', 'tutorial'];
    return workshopKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Check for keynotes
   */
  static hasKeynotes(text) {
    const keynoteKeywords = ['keynote', 'opening', 'plenary', 'featured speaker'];
    return keynoteKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Check for panel discussions
   */
  static hasPanelDiscussion(text) {
    const panelKeywords = ['panel', 'discussion', 'roundtable', 'debate', 'q&a'];
    return panelKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Extract accessibility information
   */
  static extractAccessibilityInfo(text) {
    const accessibilityKeywords = ['accessible', 'wheelchair', 'ada', 'inclusive', 'accommodation'];
    const hasAccessibility = accessibilityKeywords.some(keyword => text.includes(keyword));
    return hasAccessibility ? 'Accessible' : null;
  }

  /**
   * Extract event tags
   */
  static extractEventTags(text) {
    if (!text) return null;
    
    const tags = [];
    
    // Add event type as tag
    const eventType = SerpApiController.detectEventType(text);
    if (eventType) tags.push(eventType);
    
    // Add category as tag
    const category = SerpApiController.extractEventCategory(text);
    if (category && category !== 'General') tags.push(category);
    
    // Add format as tag
    const format = SerpApiController.extractEventFormat(text);
    if (format && format !== 'event') tags.push(format);
    
    // Add virtual tag if applicable
    if (SerpApiController.isVirtualEvent(text)) {
      tags.push('Virtual');
    }
    
    // Add free tag if applicable
    if (SerpApiController.isFreeEvent(text)) {
      tags.push('Free');
    }
    
    return tags.length > 0 ? tags : null;
  }

  /**
   * Extract keywords
   */
  static extractKeywords(text) {
    if (!text) return [];
    
    const words = text.split(/\s+/);
    const keywords = words.filter(word => 
      word.length > 4 && 
      !['this', 'that', 'with', 'from', 'they', 'been', 'have', 'were', 'said', 'each', 'which', 'their', 'time', 'will', 'about', 'would', 'there', 'could', 'other', 'after', 'first', 'well', 'also', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us', 'is', 'are', 'was', 'be', 'or', 'an', 'as', 'at', 'by', 'for', 'in', 'of', 'on', 'to', 'up', 'and', 'the'].includes(word.toLowerCase())
    );
    return keywords.slice(0, 10); // Return top 10 keywords
  }
}

module.exports = SerpApiController;
