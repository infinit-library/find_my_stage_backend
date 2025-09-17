const axios = require('axios');

class TicketmasterService {
  constructor() {
    this.baseURL = 'https://app.ticketmaster.com/discovery/v2';
    this.apiKey = process.env.TICKETMASTER_API_KEY;
    
    if (!this.apiKey) {
      console.warn('TICKETMASTER_API_KEY not found in environment variables');
    }
  }

  /**
   * Search for events with a single request (for smaller result sets)
   * @param {Object} params - Search parameters
   * @returns {Object} Formatted search results
   */
  async searchEventsFormatted(params) {
    try {
      // Check if API key is properly configured
      if (!this.apiKey || this.apiKey.length < 10) {
        console.log('Ticketmaster API key not properly configured, returning empty results');
        return {
          success: true,
          events: [],
          total_results: 0,
          total_pages: 0,
          current_page: 0,
          page_size: 0,
          query: params.keyword || '',
          location: params.city || params.countryCode || '',
          requests_made: 0,
          events_fetched: 0,
          max_requested: params.size || 0,
          source: 'Ticketmaster API (not configured)'
        };
      }

      const { keyword, city, countryCode, size, page, classificationName, classificationId } = params;
      
      const searchParams = {
        apikey: this.apiKey,
        keyword: keyword,
        size: Math.min(size, 200), // Ticketmaster max per request
        page: page
      };

      // Add classification parameters if provided and not undefined
      if (classificationName && classificationName !== 'undefined') {
        searchParams.classificationName = classificationName;
      }
      
      if (classificationId && classificationId !== 'undefined') {
        searchParams.classificationId = classificationId;
      }

      if (city) {
        searchParams.city = city;
      }
      
      if (countryCode) {
        searchParams.countryCode = countryCode;
      }

      console.log('Making Ticketmaster API request:', searchParams);

      const response = await axios.get(`${this.baseURL}/events.json`, {
        params: searchParams,
        timeout: 10000
      });

      const data = response.data;
      
      return {
        success: true,
        events: this.formatEvents(data._embedded?.events || []),
        total_results: data.page?.totalElements || 0,
        total_pages: data.page?.totalPages || 0,
        current_page: data.page?.number || 0,
        page_size: data.page?.size || 0,
        query: keyword,
        location: city ? `${city}, ${countryCode}` : countryCode,
        requests_made: 1,
        events_fetched: data._embedded?.events?.length || 0,
        max_requested: size
      };

    } catch (error) {
      console.error('Ticketmaster API error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.fault?.faultstring || error.message,
        events: [],
        total_results: 0,
        total_pages: 0,
        current_page: 0,
        page_size: 0
      };
    }
  }

  /**
   * Search for events with pagination (for larger result sets)
   * @param {Object} params - Search parameters including maxResults
   * @returns {Object} Formatted search results with pagination
   */
  async searchEventsPaginated(params) {
    try {
      // Check if API key is properly configured
      if (!this.apiKey || this.apiKey.length < 10) {
        console.log('Ticketmaster API key not properly configured, returning empty results');
        return {
          success: true,
          events: [],
          total_results: 0,
          total_pages: 0,
          current_page: 0,
          page_size: 0,
          query: params.keyword || '',
          location: params.city || params.countryCode || '',
          requests_made: 0,
          events_fetched: 0,
          max_requested: params.maxResults || 0,
          source: 'Ticketmaster API (not configured)'
        };
      }

      const { keyword, city, countryCode, maxResults, page, classificationName, classificationId } = params;
      const eventsPerPage = 200; // Ticketmaster max per request
      const totalPagesNeeded = Math.ceil(maxResults / eventsPerPage);
      
      let allEvents = [];
      let totalResults = 0;
      let totalPages = 0;
      let requestsMade = 0;
      let currentPage = page || 0;

      console.log(`Starting paginated search for ${maxResults} events across ${totalPagesNeeded} pages`);

      for (let i = 0; i < totalPagesNeeded && allEvents.length < maxResults; i++) {
        const searchParams = {
          apikey: this.apiKey,
          keyword: keyword,
          size: eventsPerPage,
          page: currentPage + i
        };

        // Add classification parameters if provided and not undefined
        if (classificationName && classificationName !== 'undefined') {
          searchParams.classificationName = classificationName;
        }
        
        if (classificationId && classificationId !== 'undefined') {
          searchParams.classificationId = classificationId;
        }

        if (city) {
          searchParams.city = city;
        }
        
        if (countryCode) {
          searchParams.countryCode = countryCode;
        }

        console.log(`Fetching page ${currentPage + i + 1}/${totalPagesNeeded}`);

        const response = await axios.get(`${this.baseURL}/events.json`, {
          params: searchParams,
          timeout: 10000
        });

        const data = response.data;
        requestsMade++;

        if (i === 0) {
          totalResults = data.page?.totalElements || 0;
          totalPages = data.page?.totalPages || 0;
        }

        const pageEvents = data._embedded?.events || [];
        allEvents = allEvents.concat(this.formatEvents(pageEvents));

        // If we got fewer events than requested, we've reached the end
        if (pageEvents.length < eventsPerPage) {
          console.log('Reached end of available events');
          break;
        }

        // Add a small delay between requests to be respectful to the API
        if (i < totalPagesNeeded - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Limit results to the requested amount
      const limitedEvents = allEvents.slice(0, maxResults);

      return {
        success: true,
        events: limitedEvents,
        total_results: totalResults,
        total_pages: totalPages,
        current_page: currentPage,
        page_size: eventsPerPage,
        query: keyword,
        location: city ? `${city}, ${countryCode}` : countryCode,
        requests_made: requestsMade,
        events_fetched: limitedEvents.length,
        max_requested: maxResults
      };

    } catch (error) {
      console.error('Ticketmaster paginated search error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.fault?.faultstring || error.message,
        events: [],
        total_results: 0,
        total_pages: 0,
        current_page: 0,
        page_size: 0,
        requests_made: 0,
        events_fetched: 0,
        max_requested: params.maxResults || 0
      };
    }
  }

  /**
   * Format Ticketmaster events to a consistent structure
   * @param {Array} events - Raw events from Ticketmaster API
   * @returns {Array} Formatted events
   */
  formatEvents(events) {
    return events.map(event => ({
      id: event.id,
      name: event.name,
      description: event.info || event.description || '',
      url: event.url,
      startDate: event.dates?.start?.dateTime || event.dates?.start?.localDate,
      endDate: event.dates?.end?.dateTime || event.dates?.end?.localDate,
      timezone: event.dates?.timezone,
      status: event.dates?.status?.code,
      venue: {
        id: event._embedded?.venues?.[0]?.id,
        name: event._embedded?.venues?.[0]?.name,
        address: event._embedded?.venues?.[0]?.address,
        city: event._embedded?.venues?.[0]?.city?.name,
        state: event._embedded?.venues?.[0]?.state?.name,
        country: event._embedded?.venues?.[0]?.country?.name,
        postalCode: event._embedded?.venues?.[0]?.postalCode,
        location: event._embedded?.venues?.[0]?.location
      },
      priceRanges: event.priceRanges || [],
      images: event.images || [],
      classifications: event.classifications || [],
      source: 'Ticketmaster',
      sourceId: event.id,
      organizer: event._embedded?.attractions?.[0]?.name || 'Unknown'
    }));
  }

  /**
   * Get event details by ID
   * @param {string} eventId - Ticketmaster event ID
   * @returns {Object} Event details
   */
  async getEventById(eventId) {
    try {
      const response = await axios.get(`${this.baseURL}/events/${eventId}.json`, {
        params: {
          apikey: this.apiKey
        },
        timeout: 10000
      });

      const event = response.data;
      return {
        success: true,
        event: this.formatEvents([event])[0]
      };

    } catch (error) {
      console.error('Ticketmaster get event by ID error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.fault?.faultstring || error.message
      };
    }
  }
}

module.exports = new TicketmasterService();
