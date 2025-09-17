const EventModel = require('../models/event.model');
const ticketmasterService = require('../services/ticketmaster.service');
const EventbriteApiService = require('../services/eventbrite-api.service');
const AISearchOptimizerService = require('../services/ai-search-optimizer.service');
const { convertToTicketmasterParams, generateSearchStrategies } = require('../../lib/ticketmaster-mapping');

class EventController {
  // Create a new event
  static async createEvent(req, res) {
    try {
      const eventData = {
        ...req.body,
        organizerId: req.user.id
      };

      const event = await EventModel.create(eventData);

      res.status(201).json({
        success: true,
        message: 'Event created successfully',
        data: event
      });
    } catch (error) {
      console.error('Create event error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get all events
  static async getEvents(req, res) {
    try {
      const { page = 1, limit = 10, ...filters } = req.query;
      
      const result = await EventModel.findAll(
        parseInt(page),
        parseInt(limit),
        filters
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get events error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get event by ID
  static async getEventById(req, res) {
    try {
      const { id } = req.params;
      const event = await EventModel.findById(id);

      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      res.json({
        success: true,
        data: event
      });
    } catch (error) {
      console.error('Get event by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update event
  static async updateEvent(req, res) {
    try {
      const { id } = req.params;
      const event = await EventModel.findById(id);

      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      // Check if user is the organizer
      if (event.organizerId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own events'
        });
      }

      const updatedEvent = await EventModel.update(id, req.body);

      res.json({
        success: true,
        message: 'Event updated successfully',
        data: updatedEvent
      });
    } catch (error) {
      console.error('Update event error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Delete event
  static async deleteEvent(req, res) {
    try {
      const { id } = req.params;
      const event = await EventModel.findById(id);

      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      // Check if user is the organizer
      if (event.organizerId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own events'
        });
      }

      await EventModel.delete(id);

      res.json({
        success: true,
        message: 'Event deleted successfully'
      });
    } catch (error) {
      console.error('Delete event error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get user's events
  static async getUserEvents(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await EventModel.findByOrganizer(
        req.user.id,
        parseInt(page),
        parseInt(limit)
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get user events error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Add speaker to event
  static async addSpeaker(req, res) {
    try {
      const { id } = req.params;
      const { userId, ...speakerData } = req.body;

      const event = await EventModel.findById(id);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      // Check if user is the organizer
      if (event.organizerId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You can only add speakers to your own events'
        });
      }

      const speaker = await EventModel.addSpeaker(id, userId, speakerData);

      res.json({
        success: true,
        message: 'Speaker added successfully',
        data: speaker
      });
    } catch (error) {
      console.error('Add speaker error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Remove speaker from event
  static async removeSpeaker(req, res) {
    try {
      const { id, userId } = req.params;

      const event = await EventModel.findById(id);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      // Check if user is the organizer
      if (event.organizerId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You can only remove speakers from your own events'
        });
      }

      await EventModel.removeSpeaker(id, userId);

      res.json({
        success: true,
        message: 'Speaker removed successfully'
      });
    } catch (error) {
      console.error('Remove speaker error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get upcoming events
  static async getUpcomingEvents(req, res) {
    try {
      const { limit = 10 } = req.query;
      const events = await EventModel.getUpcoming(parseInt(limit));

      res.json({
        success: true,
        data: events
      });
    } catch (error) {
      console.error('Get upcoming events error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get limited events (20 records)
  static async getLimitedEvents(req, res) {
    try {
      const events = await EventModel.getLimitedEvents();

      res.json({
        success: true,
        message: 'Limited events fetched successfully',
        data: events,
        count: events.length
      });
    } catch (error) {
      console.error('Get limited events error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get Ticketmaster events with industry and topic mapping
  static async getTicketmasterEvents(req, res) {
    try {
      const {
        q: keyword,
        industry,
        topic,
        city,
        country = 'US',
        size,
        num = 100, 
        page = 0
      } = req.query;

      // Check if Ticketmaster API key is configured
      const ticketmasterApiKey = process.env.TICKETMASTER_API_KEY;
      if (!ticketmasterApiKey) {
        console.log('Ticketmaster API key not configured, returning empty results');
        return res.json({
          success: true,
          message: 'Ticketmaster API key not configured - returning empty results',
          data: {
            events: [],
            total_results: 0,
            total_pages: 0,
            current_page: 0,
            page_size: 0,
            query: keyword || `${industry} ${topic}`,
            location: city || country,
            count: 0,
            requests_made: 0,
            events_fetched: 0,
            max_requested: parseInt(num) || parseInt(size) || 100,
            source: 'Ticketmaster API (not configured)'
          }
        });
      }

      let result; // Declare result variable at the top level

      // If industry and topic are provided, use mapping system
      if (industry && topic) {
        console.log('🎯 Using industry and topic mapping system');
        console.log('Industry:', industry);
        console.log('Topic:', topic);
        
        // Convert to Ticketmaster parameters
        const ticketmasterParams = convertToTicketmasterParams(industry, topic);
        console.log('🎯 Converted to Ticketmaster params:', ticketmasterParams);
        
        // Generate multiple search strategies
        const searchStrategies = generateSearchStrategies(industry, topic);
        console.log('📋 Generated search strategies:', searchStrategies);
        
        const requestedSize = parseInt(num) || parseInt(size) || 100;
        
        // Try primary search strategy first
        const searchParams = {
          keyword: ticketmasterParams.keyword,
          classificationName: ticketmasterParams.classificationName,
          classificationId: ticketmasterParams.classificationId,
          city: city?.trim(),
          countryCode: country,
          size: requestedSize,
          page: parseInt(page) || 0
        };

        if (searchParams.size < 1 || searchParams.size > 1000) {
          return res.status(400).json({
            success: false,
            message: 'Number of results (num/size) must be between 1 and 1000'
          });
        }

        console.log('Searching Ticketmaster events with mapped params:', searchParams);

        // Use pagination for requests > 20 events, regular search for <= 20
        if (searchParams.size > 20) {
          console.log(`Requesting ${searchParams.size} events - using pagination`);
          result = await ticketmasterService.searchEventsPaginated({
            ...searchParams,
            maxResults: searchParams.size
          });
        } else {
          console.log(`Requesting ${searchParams.size} events - using single request`);
          result = await ticketmasterService.searchEventsFormatted(searchParams);
        }

        // If primary search fails, try alternative strategies
        if (!result.success && searchStrategies.length > 1) {
          console.log('❌ Primary search failed, trying alternative strategies...');
          console.log(`🔍 Primary search error: ${result.error}`);
          
          for (const strategy of searchStrategies.slice(1)) {
            console.log(`🔄 Trying alternative strategy: ${strategy.keyword}`);
            
            const altSearchParams = {
              keyword: strategy.keyword,
              classificationName: strategy.classificationName,
              classificationId: strategy.classificationId,
              city: city?.trim(),
              countryCode: country,
              size: requestedSize,
              page: parseInt(page) || 0
            };
            
            if (altSearchParams.size > 20) {
              result = await ticketmasterService.searchEventsPaginated({
                ...altSearchParams,
                maxResults: altSearchParams.size
              });
            } else {
              result = await ticketmasterService.searchEventsFormatted(altSearchParams);
            }
            
            console.log(`📊 Strategy "${strategy.keyword}" result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
            if (result.success) {
              console.log(`✅ Alternative strategy succeeded! Found ${result.events?.length || 0} events`);
              break;
            } else {
              console.log(`❌ Strategy failed: ${result.error}`);
            }
          }
        }
      } else {
        // Fallback to original keyword-based search
        if (!keyword) {
          return res.status(400).json({
            success: false,
            message: 'Search query (q) or industry/topic combination is required'
          });
        }

        const requestedSize = parseInt(num) || parseInt(size) || 100;

        const searchParams = {
          keyword: keyword.trim(),
          city: city?.trim(),
          countryCode: country,
          size: requestedSize,
          page: parseInt(page) || 0
        };

        if (searchParams.size < 1 || searchParams.size > 1000) {
          return res.status(400).json({
            success: false,
            message: 'Number of results (num/size) must be between 1 and 1000'
          });
        }

        console.log('Searching Ticketmaster events with keyword params:', searchParams);

        // Use pagination for requests > 20 events, regular search for <= 20
        if (searchParams.size > 20) {
          console.log(`Requesting ${searchParams.size} events - using pagination`);
          result = await ticketmasterService.searchEventsPaginated({
            ...searchParams,
            maxResults: searchParams.size
          });
        } else {
          console.log(`Requesting ${searchParams.size} events - using single request`);
          result = await ticketmasterService.searchEventsFormatted(searchParams);
        }
      }

      if (!result || !result.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch Ticketmaster events',
          error: result?.error || 'No result returned from Ticketmaster service'
        });
      }

      res.json({
        success: true,
        message: 'Ticketmaster events retrieved successfully',
        data: {
          events: result.events,
          total_results: result.total_results,
          total_pages: result.total_pages,
          current_page: result.current_page,
          page_size: result.page_size,
          query: result.query,
          location: result.location,
          count: result.events.length,
          requests_made: result.requests_made,
          events_fetched: result.events_fetched,
          max_requested: result.max_requested,
          source: 'Ticketmaster API'
        }
      });

    } catch (error) {
      console.error('Ticketmaster events search error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get Eventbrite events with industry and topic mapping
  static async getEventbriteEvents(req, res) {
    try {
      const {
        q: keyword,
        industry,
        topic,
        city,
        country = 'US',
        size,
        num = 100,
        page = 0
      } = req.query;

      // Initialize Eventbrite service with API key from environment
      const eventbriteApiKey = process.env.EVENTBRITE_API_KEY;
      if (!eventbriteApiKey) {
        console.log('Eventbrite API key not configured, returning empty results');
        return res.json({
          success: true,
          message: 'Eventbrite API key not configured - returning empty results',
          data: {
            events: [],
            total_results: 0,
            total_pages: 0,
            current_page: 0,
            page_size: 0,
            query: keyword || `${industry} ${topic}`,
            location: city || 'Los Angeles',
            count: 0,
            requests_made: 0,
            events_fetched: 0,
            max_requested: parseInt(num) || parseInt(size) || 100,
            source: 'Eventbrite API (not configured)'
          }
        });
      }

      const eventbriteService = new EventbriteApiService(eventbriteApiKey);
      let result;

      // If industry and topic are provided, use AI-powered optimization
      if (industry && topic) {
        console.log('🤖 Using AI-powered search optimization for Eventbrite');
        console.log('Industry:', industry);
        console.log('Topic:', topic);
        
        // Initialize AI optimizer
        const aiOptimizer = new AISearchOptimizerService();
        
        // Generate AI-optimized search strategies
        const searchStrategies = await aiOptimizer.generateSearchStrategies(industry, topic);
        console.log('🎯 AI-optimized search strategies:', searchStrategies);
        
        const requestedSize = Math.min(parseInt(num) || parseInt(size) || 100, 1000);
        const searchCity = city?.trim() || 'Los Angeles';
        
        let bestResult = null;
        let totalEvents = [];
        let totalRequests = 0;

        // Try each AI-optimized strategy
        for (const strategy of searchStrategies.strategies.slice(0, 3)) { // Limit to top 3 strategies
          console.log(`🔍 Trying AI strategy ${strategy.priority}: "${strategy.keyword}"`);
          
          try {
            const events = await eventbriteService.searchEvents(searchCity, {
              q: strategy.keyword,
              categories: strategy.category,
              'location.address': searchCity,
              'location.within': '50mi',
              expand: 'venue,organizer,category',
              status: 'live',
              order_by: 'start_asc',
              page_size: Math.min(50, requestedSize) // Eventbrite max is 50 per page
            });
            
            totalRequests++;
            totalEvents = [...totalEvents, ...events];
            console.log(`✅ Strategy "${strategy.keyword}" found ${events.length} events`);
            
            // If we found enough events, we can stop
            if (totalEvents.length >= requestedSize) {
              break;
            }
            
          } catch (error) {
            console.error(`❌ Strategy "${strategy.keyword}" failed:`, error.message);
            totalRequests++;
          }
        }

        // Remove duplicates based on event ID
        const uniqueEvents = totalEvents.filter((event, index, self) => 
          index === self.findIndex(e => e.sourceId === event.sourceId)
        );

        result = {
          success: true,
          events: uniqueEvents.slice(0, requestedSize),
          total_results: uniqueEvents.length,
          total_pages: Math.ceil(uniqueEvents.length / 50),
          current_page: parseInt(page) || 0,
          page_size: 50,
          query: searchStrategies.optimization.primaryKeyword,
          location: searchCity,
          count: uniqueEvents.length,
          requests_made: totalRequests,
          events_fetched: uniqueEvents.length,
          max_requested: requestedSize,
          source: 'Eventbrite API (AI-optimized)',
          aiOptimization: {
            reasoning: searchStrategies.optimization.reasoning,
            source: searchStrategies.optimization.source,
            strategiesUsed: searchStrategies.strategies.slice(0, 3).length
          }
        };
      } else {
        // Fallback to keyword-based search with AI optimization
        if (!keyword) {
          return res.status(400).json({
            success: false,
            message: 'Search query (q) or industry/topic combination is required'
          });
        }

        console.log('🔍 Using AI optimization for keyword search:', keyword);
        
        // Try to extract industry/topic from keyword for AI optimization
        const aiOptimizer = new AISearchOptimizerService();
        const optimizedKeyword = await this.optimizeKeywordWithAI(keyword, aiOptimizer);
        
        const requestedSize = Math.min(parseInt(num) || parseInt(size) || 100, 1000);
        const searchCity = city?.trim() || 'Los Angeles';

        console.log('Searching Eventbrite events with AI-optimized keyword:', optimizedKeyword);

        try {
          const events = await eventbriteService.searchEvents(searchCity, {
            q: optimizedKeyword,
            'location.address': searchCity,
            'location.within': '50mi',
            expand: 'venue,organizer,category',
            status: 'live',
            order_by: 'start_asc',
            page_size: Math.min(requestedSize, 50)
          });
          
          result = {
            success: true,
            events: events,
            total_results: events.length,
            total_pages: Math.ceil(events.length / 50),
            current_page: parseInt(page) || 0,
            page_size: 50,
            query: optimizedKeyword,
            location: searchCity,
            count: events.length,
            requests_made: 1,
            events_fetched: events.length,
            max_requested: requestedSize,
            source: 'Eventbrite API (AI-optimized keyword)',
            originalKeyword: keyword,
            aiOptimization: {
              reasoning: 'AI-optimized keyword search',
              source: 'AI keyword enhancement'
            }
          };
        } catch (error) {
          console.error('Eventbrite search error:', error);
          result = {
            success: false,
            error: error.message,
            events: [],
            total_results: 0,
            total_pages: 0,
            current_page: 0,
            page_size: 0,
            query: optimizedKeyword,
            location: searchCity,
            count: 0,
            requests_made: 1,
            events_fetched: 0,
            max_requested: requestedSize,
            source: 'Eventbrite API (AI-optimized keyword)',
            originalKeyword: keyword
          };
        }
      }

      if (!result || !result.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch Eventbrite events',
          error: result?.error || 'No result returned from Eventbrite service'
        });
      }

      res.json({
        success: true,
        message: 'Eventbrite events retrieved successfully',
        data: result
      });

    } catch (error) {
      console.error('Eventbrite events search error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

// Helper method to optimize keyword with AI
EventController.optimizeKeywordWithAI = async function(keyword, aiOptimizer) {
  try {
    // Try to extract industry and topic from keyword
    const keywordLower = keyword.toLowerCase();
    
    // Common industry keywords
    const industries = ['technology', 'healthcare', 'finance', 'education', 'marketing', 'real estate', 'entertainment', 'sports', 'food', 'fashion', 'travel'];
    const topics = ['artificial intelligence', 'machine learning', 'digital marketing', 'leadership', 'innovation', 'sustainability', 'cybersecurity', 'blockchain'];
    
    let detectedIndustry = null;
    let detectedTopic = null;
    
    // Try to detect industry
    for (const industry of industries) {
      if (keywordLower.includes(industry)) {
        detectedIndustry = industry;
        break;
      }
    }
    
    // Try to detect topic
    for (const topic of topics) {
      if (keywordLower.includes(topic)) {
        detectedTopic = topic;
        break;
      }
    }
    
    // If we detected both, use AI optimization
    if (detectedIndustry && detectedTopic) {
      const optimization = await aiOptimizer.optimizeEventbriteSearchTerms(detectedIndustry, detectedTopic);
      return optimization.primaryKeyword;
    }
    
    // Otherwise, use simple keyword enhancement
    return this.enhanceKeyword(keyword);
    
  } catch (error) {
    console.error('AI keyword optimization failed:', error.message);
    return this.enhanceKeyword(keyword);
  }
};

// Helper method to enhance keyword without AI
EventController.enhanceKeyword = function(keyword) {
  const keywordLower = keyword.toLowerCase();
  
  // Add common event-related terms if not present
  if (!keywordLower.includes('conference') && !keywordLower.includes('summit') && !keywordLower.includes('event')) {
    return `${keyword} conference`;
  }
  
  return keyword;
};

// Helper function to convert industry/topic to Eventbrite parameters
function convertToEventbriteParams(industry, topic) {
  // Map industry and topic to Eventbrite search parameters
  const industryMappings = {
    'Technology': { keyword: 'tech conference', category: '102' }, // Technology
    'Healthcare': { keyword: 'healthcare conference', category: '108' }, // Health & Wellness
    'Finance': { keyword: 'finance conference', category: '103' }, // Business & Professional
    'Education': { keyword: 'education conference', category: '104' }, // Science & Tech
    'Marketing': { keyword: 'marketing conference', category: '103' }, // Business & Professional
    'Real Estate': { keyword: 'real estate conference', category: '103' }, // Business & Professional
    'Entertainment': { keyword: 'entertainment conference', category: '105' }, // Music
    'Sports': { keyword: 'sports conference', category: '108' }, // Health & Wellness
    'Food & Beverage': { keyword: 'food conference', category: '110' }, // Food & Drink
    'Fashion': { keyword: 'fashion conference', category: '106' }, // Fashion & Beauty
    'Travel': { keyword: 'travel conference', category: '109' }, // Travel & Outdoor
    'Automotive': { keyword: 'automotive conference', category: '103' }, // Business & Professional
    'Energy': { keyword: 'energy conference', category: '103' }, // Business & Professional
    'Manufacturing': { keyword: 'manufacturing conference', category: '103' }, // Business & Professional
    'Retail': { keyword: 'retail conference', category: '103' }, // Business & Professional
    'Consulting': { keyword: 'consulting conference', category: '103' }, // Business & Professional
    'Non-profit': { keyword: 'nonprofit conference', category: '103' }, // Business & Professional
    'Government': { keyword: 'government conference', category: '103' }, // Business & Professional
    'Media': { keyword: 'media conference', category: '105' }, // Music
    'Telecommunications': { keyword: 'telecommunications conference', category: '102' } // Technology
  };

  const topicMappings = {
    'Artificial Intelligence': { keyword: 'AI artificial intelligence', category: '102' },
    'Machine Learning': { keyword: 'machine learning ML', category: '102' },
    'Data Science': { keyword: 'data science analytics', category: '102' },
    'Cybersecurity': { keyword: 'cybersecurity security', category: '102' },
    'Cloud Computing': { keyword: 'cloud computing AWS Azure', category: '102' },
    'Blockchain': { keyword: 'blockchain cryptocurrency', category: '102' },
    'Digital Marketing': { keyword: 'digital marketing SEO', category: '103' },
    'Social Media': { keyword: 'social media marketing', category: '103' },
    'Content Marketing': { keyword: 'content marketing', category: '103' },
    'E-commerce': { keyword: 'ecommerce online retail', category: '103' },
    'Leadership': { keyword: 'leadership management', category: '103' },
    'Innovation': { keyword: 'innovation entrepreneurship', category: '103' },
    'Sustainability': { keyword: 'sustainability green', category: '103' },
    'Diversity & Inclusion': { keyword: 'diversity inclusion', category: '103' },
    'Remote Work': { keyword: 'remote work virtual', category: '103' },
    'Customer Experience': { keyword: 'customer experience CX', category: '103' },
    'Sales': { keyword: 'sales strategy', category: '103' },
    'Finance': { keyword: 'finance investment', category: '103' },
    'Healthcare Technology': { keyword: 'healthcare technology', category: '108' },
    'Mental Health': { keyword: 'mental health wellness', category: '108' },
    'Education Technology': { keyword: 'education technology edtech', category: '104' },
    'Online Learning': { keyword: 'online learning e-learning', category: '104' },
    'Startup': { keyword: 'startup entrepreneurship', category: '103' },
    'Venture Capital': { keyword: 'venture capital funding', category: '103' }
  };

  // Try to find specific topic mapping first
  if (topicMappings[topic]) {
    return topicMappings[topic];
  }

  // Fall back to industry mapping
  if (industryMappings[industry]) {
    return industryMappings[industry];
  }

  // Default fallback
  return {
    keyword: `${topic} ${industry}`,
    category: '103' // Business & Professional
  };
}

module.exports = EventController;
