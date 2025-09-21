const axios = require('axios');

class EventbriteApiService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://www.eventbriteapi.com/v3/events/search/';
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async searchEvents(city, options = {}) {
    try {
      
      if (!this.apiKey || this.apiKey === 'test-key' || this.apiKey.length < 10) {
        console.log('Eventbrite API key not properly configured, returning empty results');
        return [];
      }

      const params = {
        'location.address': city,
        'expand': 'venue,organizer,category',
        'status': 'live',
        'order_by': 'start_asc',
        ...options
      };

      console.log(`Searching for events in ${city}...`);
      console.log('Eventbrite API params:', params);
      
      const response = await this.client.get('/events/search/', { params });
      const events = response.data.events || [];
      
      console.log(`Found ${events.length} events from Eventbrite API`);
      
      return this.formatEvents(events);
    } catch (error) {
      console.error('Error fetching events from Eventbrite API:', error.response?.data || error.message);
      console.error('Full error:', error);
      
      
      console.log('Returning empty array due to Eventbrite API error');
      return [];
    }
  }


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


  async getCategories() {
    try {
      const response = await this.client.get('/categories/');
      return response.data.categories || [];
    } catch (error) {
      console.error('Error fetching categories:', error.response?.data || error.message);
      throw new Error(`Eventbrite API error: ${error.response?.data?.error_description || error.message}`);
    }
  }

  isEventExpired(event) {
    if (!event.start || !event.start.utc) {
      return false; 
    }
    
    const eventDate = new Date(event.start.utc);
    const now = new Date();
    
    
    const oneDayInMs = 24 * 60 * 60 * 1000;
    return eventDate.getTime() < (now.getTime() - oneDayInMs);
  }

  
  formatEvents(events) {
    
    const activeEvents = events.filter(event => !this.isEventExpired(event));
    console.log(`📅 Filtered out ${events.length - activeEvents.length} expired events from Eventbrite`);
    
    return activeEvents.map(event => this.formatEvent(event));
  }

  
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


  async saveEventsToDatabase(events, db) {
    try {
      const savedEvents = [];
      const errors = [];

      for (const event of events) {
        try {
          
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

  extractCity(location) {
    if (!location) return 'Los Angeles';
    
    
    const parts = location.split(',');
    if (parts.length > 0) {
      return parts[0].trim();
    }
    
    return 'Los Angeles';
  }

  extractState(location) {
    if (!location) return 'CA';
    
    
    const stateMatch = location.match(/\b([A-Z]{2})\b/);
    if (stateMatch) {
      return stateMatch[1];
    }
    
    
    if (location.toLowerCase().includes('california') || location.toLowerCase().includes('ca')) {
      return 'CA';
    }
    
    return 'CA';
  }

  extractCountry(location) {
    if (!location) return 'USA';
    
    if (location.toLowerCase().includes('usa') || location.toLowerCase().includes('united states')) {
      return 'USA';
    }
    
    return 'USA';
  }
}

module.exports = EventbriteApiService;
