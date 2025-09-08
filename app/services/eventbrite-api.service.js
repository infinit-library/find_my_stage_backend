const axios = require('axios');

class EventbriteApiService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://www.eventbriteapi.com/v3';
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Search for events in a specific location
   * @param {string} city - City name
   * @param {Object} options - Search options
   * @returns {Array} Array of event objects
   */
  async searchEvents(city, options = {}) {
    try {
      const params = {
        'location.address': city,
        'expand': 'venue,organizer,category',
        'status': 'live',
        'order_by': 'start_asc',
        ...options
      };

      console.log(`Searching for events in ${city}...`);
      
      const response = await this.client.get('/events/search/', { params });
      const events = response.data.events || [];
      
      console.log(`Found ${events.length} events from Eventbrite API`);
      
      return this.formatEvents(events);
    } catch (error) {
      console.error('Error fetching events from Eventbrite API:', error.response?.data || error.message);
      throw new Error(`Eventbrite API error: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Get events by category
   * @param {string} city - City name
   * @param {string} category - Event category
   * @param {Object} options - Search options
   * @returns {Array} Array of event objects
   */
  async getEventsByCategory(city, category, options = {}) {
    try {
      const params = {
        'location.address': city,
        'categories': category,
        'expand': 'venue,organizer,category',
        'status': 'live',
        'order_by': 'start_asc',
        ...options
      };

      console.log(`Searching for ${category} events in ${city}...`);
      
      const response = await this.client.get('/events/search/', { params });
      const events = response.data.events || [];
      
      console.log(`Found ${events.length} ${category} events from Eventbrite API`);
      
      return this.formatEvents(events);
    } catch (error) {
      console.error('Error fetching events by category:', error.response?.data || error.message);
      throw new Error(`Eventbrite API error: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Get event details by ID
   * @param {string} eventId - Event ID
   * @returns {Object} Event details
   */
  async getEventDetails(eventId) {
    try {
      const response = await this.client.get(`/events/${eventId}/`, {
        params: {
          'expand': 'venue,organizer,category,description'
        }
      });
      
      return this.formatEvent(response.data);
    } catch (error) {
      console.error('Error fetching event details:', error.response?.data || error.message);
      throw new Error(`Eventbrite API error: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Get popular event categories
   * @returns {Array} Array of category objects
   */
  async getCategories() {
    try {
      const response = await this.client.get('/categories/');
      return response.data.categories || [];
    } catch (error) {
      console.error('Error fetching categories:', error.response?.data || error.message);
      throw new Error(`Eventbrite API error: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Format events from API response
   * @param {Array} events - Raw events from API
   * @returns {Array} Formatted events
   */
  formatEvents(events) {
    return events.map(event => this.formatEvent(event));
  }

  /**
   * Format single event from API response
   * @param {Object} event - Raw event from API
   * @returns {Object} Formatted event
   */
  formatEvent(event) {
    const startDate = event.start ? new Date(event.start.utc) : null;
    const endDate = event.end ? new Date(event.end.utc) : null;
    
    return {
      title: event.name?.text || 'Untitled Event',
      description: event.description?.text || '',
      dateTime: startDate ? startDate.toISOString() : null,
      startDate: startDate,
      endDate: endDate,
      location: event.venue?.address?.localized_area_display || 
                event.venue?.name || 
                event.venue?.address?.city || 'Location TBD',
      venue: event.venue?.name || '',
      address: event.venue?.address ? {
        address1: event.venue.address.address_1,
        address2: event.venue.address.address_2,
        city: event.venue.address.city,
        region: event.venue.address.region,
        postalCode: event.venue.address.postal_code,
        country: event.venue.address.country,
        localized: event.venue.address.localized_area_display
      } : null,
      price: event.is_free ? 0 : (event.ticket_availability?.minimum_ticket_price?.major_value || 0),
      priceDisplay: event.is_free ? 'Free' : 
                   (event.ticket_availability?.minimum_ticket_price?.display || 'Price varies'),
      currency: event.ticket_availability?.minimum_ticket_price?.currency || 'USD',
      isFree: event.is_free || false,
      imageUrl: event.logo?.url || event.logo?.original?.url,
      eventUrl: event.url,
      category: event.category?.name || '',
      categoryId: event.category?.id || '',
      organizer: event.organizer ? {
        name: event.organizer.name,
        description: event.organizer.description?.text,
        url: event.organizer.url
      } : null,
      capacity: event.capacity,
      status: event.status,
      source: 'Eventbrite',
      sourceId: event.id,
      scrapedAt: new Date().toISOString(),
      metadata: {
        apiVersion: 'v3',
        originalData: event
      }
    };
  }

  /**
   * Save events to database
   * @param {Array} events - Array of formatted event objects
   * @param {Object} db - Database connection
   * @returns {Object} Save result
   */
  async saveEventsToDatabase(events, db) {
    try {
      const savedEvents = [];
      const errors = [];

      for (const event of events) {
        try {
          // Check if event already exists by source ID
          const existingEvent = await db.event.findFirst({
            where: {
              OR: [
                { sourceId: event.sourceId },
                { 
                  AND: [
                    { title: event.title },
                    { dateTime: event.dateTime },
                    { source: 'Eventbrite' }
                  ]
                }
              ]
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
              dateTime: event.dateTime,
              location: event.location,
              venue: event.venue,
              price: event.price,
              priceDisplay: event.priceDisplay,
              imageUrl: event.imageUrl,
              eventUrl: event.eventUrl,
              category: event.category,
              source: event.source,
              sourceId: event.sourceId,
              city: this.extractCity(event.location),
              state: this.extractState(event.location),
              country: this.extractCountry(event.location),
              scrapedAt: new Date(),
              metadata: event.metadata
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

  /**
   * Extract city from location string
   * @param {string} location - Location string
   * @returns {string} City name
   */
  extractCity(location) {
    if (!location) return 'Los Angeles';
    
    // Try to extract city from location string
    const parts = location.split(',');
    if (parts.length > 0) {
      return parts[0].trim();
    }
    
    return 'Los Angeles';
  }

  /**
   * Extract state from location string
   * @param {string} location - Location string
   * @returns {string} State abbreviation
   */
  extractState(location) {
    if (!location) return 'CA';
    
    // Look for state abbreviations
    const stateMatch = location.match(/\b([A-Z]{2})\b/);
    if (stateMatch) {
      return stateMatch[1];
    }
    
    // Look for California
    if (location.toLowerCase().includes('california') || location.toLowerCase().includes('ca')) {
      return 'CA';
    }
    
    return 'CA';
  }

  /**
   * Extract country from location string
   * @param {string} location - Location string
   * @returns {string} Country name
   */
  extractCountry(location) {
    if (!location) return 'USA';
    
    if (location.toLowerCase().includes('usa') || location.toLowerCase().includes('united states')) {
      return 'USA';
    }
    
    return 'USA';
  }
}

module.exports = EventbriteApiService;
