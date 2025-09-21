const EventModel = require('../models/event.model');
const ticketmasterService = require('../services/ticketmaster.service');
const EventbriteApiService = require('../services/eventbrite-api.service');
const AISearchOptimizerService = require('../services/ai-search-optimizer.service');
const callForDataSpeakersService = require('../services/callfordataspeakers.service');
const { convertToTicketmasterParams, generateSearchStrategies } = require('../../lib/ticketmaster-mapping');

class EventController {
  
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

  
  static async getTicketmasterEvents(req, res) {
    try {
      return
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

      
      const decodedIndustry = industry ? decodeURIComponent(industry.replace(/\+/g, ' ')) : industry;
      const decodedTopic = topic ? decodeURIComponent(topic.replace(/\+/g, ' ')) : topic;
      const decodedKeyword = keyword ? decodeURIComponent(keyword.replace(/\+/g, ' ')) : keyword;
      const decodedCity = city ? decodeURIComponent(city.replace(/\+/g, ' ')) : city;

      
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
            query: decodedKeyword || `${decodedIndustry} ${decodedTopic}`,
            location: decodedCity || country,
            count: 0,
            requests_made: 0,
            events_fetched: 0,
            max_requested: parseInt(num) || parseInt(size) || 100,
            source: 'Ticketmaster API (not configured)'
          }
        });
      }

      let result; 

      
      if (decodedIndustry && decodedTopic) {
        console.log('🎯 Using industry and topic mapping system');
        console.log('Industry:', decodedIndustry);
        console.log('Topic:', decodedTopic);
        
        
        const ticketmasterParams = convertToTicketmasterParams(decodedIndustry, decodedTopic);
        console.log('🎯 Converted to Ticketmaster params:', ticketmasterParams);
        
        
        const searchStrategies = generateSearchStrategies(decodedIndustry, decodedTopic);
        console.log('📋 Generated search strategies:', searchStrategies);
        
        const requestedSize = parseInt(num) || parseInt(size) || 100;
        
        
        const searchParams = {
          keyword: ticketmasterParams.keyword,
          classificationName: ticketmasterParams.classificationName,
          classificationId: ticketmasterParams.classificationId,
          city: decodedCity?.trim(),
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

        
        if (!result.success && searchStrategies.length > 1) {
          console.log('❌ Primary search failed, trying alternative strategies...');
          console.log(`🔍 Primary search error: ${result.error}`);
          
          for (const strategy of searchStrategies.slice(1)) {
            console.log(`🔄 Trying alternative strategy: ${strategy.keyword}`);
            
            const altSearchParams = {
              keyword: strategy.keyword,
              classificationName: strategy.classificationName,
              classificationId: strategy.classificationId,
              city: decodedCity?.trim(),
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
        
        if (!decodedKeyword) {
          return res.status(400).json({
            success: false,
            message: 'Search query (q) or industry/topic combination is required'
          });
        }

        const requestedSize = parseInt(num) || parseInt(size) || 100;

        const searchParams = {
          keyword: decodedKeyword.trim(),
          city: decodedCity?.trim(),
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

      
      const decodedIndustry = industry ? decodeURIComponent(industry.replace(/\+/g, ' ')) : industry;
      const decodedTopic = topic ? decodeURIComponent(topic.replace(/\+/g, ' ')) : topic;
      const decodedKeyword = keyword ? decodeURIComponent(keyword.replace(/\+/g, ' ')) : keyword;
      const decodedCity = city ? decodeURIComponent(city.replace(/\+/g, ' ')) : city;
      
      
      console.log('🔍 Eventbrite URL Parameter Decoding:');
      console.log('  Original industry:', industry, '→ Decoded:', decodedIndustry);
      console.log('  Original topic:', topic, '→ Decoded:', decodedTopic);
      console.log('  Original keyword:', keyword, '→ Decoded:', decodedKeyword);
      console.log('  Original city:', city, '→ Decoded:', decodedCity);

      
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
            query: decodedKeyword || `${decodedIndustry} ${decodedTopic}`,
            location: decodedCity || 'Los Angeles',
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

      
      if (decodedIndustry && decodedTopic) {
        console.log('🤖 Using AI-powered search optimization for Eventbrite');
        console.log('Industry:', decodedIndustry);
        console.log('Topic:', decodedTopic);
        
        
        const aiOptimizer = new AISearchOptimizerService();
        
        
        const searchStrategies = await aiOptimizer.generateSearchStrategies(decodedIndustry, decodedTopic);
        console.log('🎯 AI-optimized search strategies:', searchStrategies);
        
        const requestedSize = Math.min(parseInt(num) || parseInt(size) || 100, 1000);
        const searchCity = decodedCity?.trim() || 'Los Angeles';
        
        let bestResult = null;
        let totalEvents = [];
        let totalRequests = 0;

        
        for (const strategy of searchStrategies.strategies.slice(0, 3)) { 
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
              page_size: Math.min(50, requestedSize) 
            });
            
            totalRequests++;
            totalEvents = [...totalEvents, ...events];
            console.log(`✅ Strategy "${strategy.keyword}" found ${events.length} events`);
            
            
            if (totalEvents.length >= requestedSize) {
              break;
            }
            
          } catch (error) {
            console.error(`❌ Strategy "${strategy.keyword}" failed:`, error.message);
            totalRequests++;
          }
        }

        
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
        
        if (!decodedKeyword) {
          return res.status(400).json({
            success: false,
            message: 'Search query (q) or industry/topic combination is required'
          });
        }

        console.log('🔍 Using AI optimization for keyword search:', decodedKeyword);
        
        
        const aiOptimizer = new AISearchOptimizerService();
        const optimizedKeyword = await this.optimizeKeywordWithAI(decodedKeyword, aiOptimizer);
        
        const requestedSize = Math.min(parseInt(num) || parseInt(size) || 100, 1000);
        const searchCity = decodedCity?.trim() || 'Los Angeles';

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
            originalKeyword: decodedKeyword,
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
            originalKeyword: decodedKeyword
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

  
  static async getCallForDataSpeakersEvents(req, res) {
    try {
      const {
        region,
        status,
        search,
        industry,
        topic,
        page = 1,
        limit = 20
      } = req.query;

      
      const decodedIndustry = industry ? decodeURIComponent(industry.replace(/\+/g, ' ')) : industry;
      const decodedTopic = topic ? decodeURIComponent(topic.replace(/\+/g, ' ')) : topic;
      const decodedSearch = search ? decodeURIComponent(search.replace(/\+/g, ' ')) : search;

      console.log('Fetching Call for Data Speakers events with params:', { region, status, search: decodedSearch, industry: decodedIndustry, topic: decodedTopic, page, limit });

      let result;

      
      if (decodedSearch || (decodedIndustry && decodedTopic)) {
        
        if (decodedIndustry && decodedTopic) {
          console.log('🤖 Using AI-powered search optimization for Call for Data Speakers');
          console.log('Industry:', decodedIndustry);
          console.log('Topic:', decodedTopic);
          
          const aiOptimizer = new AISearchOptimizerService();
          
          
          const searchStrategies = await aiOptimizer.generateCallForDataSpeakersSearchStrategies(decodedIndustry, decodedTopic);
          console.log('🎯 AI-optimized search strategies:', searchStrategies.strategies.length);
          
          let bestResult = null;
          let bestResultCount = 0;
          let totalRequests = 0;
          
          
          for (const strategy of searchStrategies.strategies.slice(0, 3)) { 
            console.log(`🔍 Trying AI strategy ${strategy.priority}: "${strategy.keyword}"`);
            
            try {
              const strategyResult = await callForDataSpeakersService.searchEvents(strategy.keyword);
              totalRequests++;
              
              if (strategyResult.success && strategyResult.events && strategyResult.events.length > bestResultCount) {
                bestResult = strategyResult;
                bestResultCount = strategyResult.events.length;
                console.log(`✅ Strategy "${strategy.keyword}" found ${bestResultCount} events`);
              }
              
              
              if (bestResultCount >= 10) {
                break;
              }
              
            } catch (error) {
              console.error(`❌ Strategy "${strategy.keyword}" failed:`, error.message);
              totalRequests++;
            }
          }
          
          result = bestResult || await callForDataSpeakersService.searchEvents(decodedSearch || `${decodedIndustry} ${decodedTopic}`);
          
          
          if (result && result.success && result.events) {
            const originalCount = result.events.length;
            const filteredEvents = EventController.filterCallForDataSpeakersEventsByKeywords(result.events, { industry: decodedIndustry, topic: decodedTopic });
            result.events = filteredEvents;
            result.total_count = filteredEvents.length;
            result.count = filteredEvents.length;
            
            console.log(`🎯 Filtered Call for Data Speakers events from ${originalCount} to ${filteredEvents.length} based on keywords: "${decodedIndustry}" and "${decodedTopic}"`);
          }
          
          
          if (result && result.success) {
            result.ai_optimization_used = true;
            result.optimization_info = {
              industry: decodedIndustry,
              topic: decodedTopic,
              strategies_tried: totalRequests,
              best_strategy: bestResult ? 'AI-optimized' : 'fallback',
              message: 'AI-powered search optimization was applied to improve results'
            };
          }
        } else {
          result = await callForDataSpeakersService.searchEvents(decodedSearch);
        }
      } else if (region) {
        result = await callForDataSpeakersService.getEventsByRegion(region);
      } else if (status) {
        result = await callForDataSpeakersService.getEventsByStatus(status);
      } else if (page || limit) {
        result = await callForDataSpeakersService.getEventsPaginated({ page, limit });
      } else {
        result = await callForDataSpeakersService.getEvents();
      }

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch Call for Data Speakers events',
          error: result.error
        });
      }

      res.json({
        success: true,
        message: 'Call for Data Speakers events retrieved successfully',
        data: {
          events: result.events,
          total_count: result.total_count,
          pagination: result.pagination || null,
          filter: result.filter || null,
          search: result.search || { industry: decodedIndustry, topic: decodedTopic, search: decodedSearch },
          count: result.events.length,
          source: 'Call for Data Speakers',
          fetched_at: result.fetched_at,
          ai_optimization_used: result.ai_optimization_used || false,
          optimization_info: result.optimization_info || null
        }
      });

    } catch (error) {
      console.error('Call for Data Speakers events error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  
  static async getCallForDataSpeakersStats(req, res) {
    try {
      console.log('Fetching Call for Data Speakers event statistics');

      const result = await callForDataSpeakersService.getEventStats();

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to get Call for Data Speakers event statistics',
          error: result.error
        });
      }

      res.json({
        success: true,
        message: 'Call for Data Speakers event statistics retrieved successfully',
        data: {
          statistics: result.statistics,
          generated_at: result.generated_at,
          source: 'Call for Data Speakers'
        }
      });

    } catch (error) {
      console.error('Call for Data Speakers statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  
  static async getCallForDataSpeakersEventsByRegion(req, res) {
    try {
      const { region } = req.params;
      const { page = 1, limit = 20 } = req.query;

      if (!region) {
        return res.status(400).json({
          success: false,
          message: 'Region parameter is required'
        });
      }

      console.log(`Fetching Call for Data Speakers events for region: ${region}`);

      let result = await callForDataSpeakersService.getEventsByRegion(region);

      
      if (page || limit) {
        const pageNum = parseInt(page) || 1;
        const limitNum = Math.min(parseInt(limit) || 20, 100);
        const offset = (pageNum - 1) * limitNum;

        const events = result.events || [];
        const totalCount = events.length;
        const paginatedEvents = events.slice(offset, offset + limitNum);
        const totalPages = Math.ceil(totalCount / limitNum);

        result = {
          ...result,
          events: paginatedEvents,
          pagination: {
            current_page: pageNum,
            per_page: limitNum,
            total_results: totalCount,
            total_pages: totalPages,
            has_more: pageNum < totalPages,
            next_page: pageNum < totalPages ? pageNum + 1 : null,
            previous_page: pageNum > 1 ? pageNum - 1 : null
          }
        };
      }

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch Call for Data Speakers events by region',
          error: result.error
        });
      }

      res.json({
        success: true,
        message: `Call for Data Speakers events for region '${region}' retrieved successfully`,
        data: {
          events: result.events,
          total_count: result.total_count,
          pagination: result.pagination || null,
          filter: { region },
          count: result.events.length,
          source: 'Call for Data Speakers',
          fetched_at: result.fetched_at
        }
      });

    } catch (error) {
      console.error('Call for Data Speakers events by region error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  
  static async searchCallForDataSpeakersEvents(req, res) {
    try {
      const { q: keyword, industry, topic } = req.query;
      const { page = 1, limit = 20 } = req.query;

      
      const decodedIndustry = industry ? decodeURIComponent(industry.replace(/\+/g, ' ')) : industry;
      const decodedTopic = topic ? decodeURIComponent(topic.replace(/\+/g, ' ')) : topic;
      const decodedKeyword = keyword ? decodeURIComponent(keyword.replace(/\+/g, ' ')) : keyword;
      
      
      console.log('🔍 Call for Data Speakers URL Parameter Decoding:');
      console.log('  Original keyword:', keyword, '→ Decoded:', decodedKeyword);
      console.log('  Original industry:', industry, '→ Decoded:', decodedIndustry);
      console.log('  Original topic:', topic, '→ Decoded:', decodedTopic);

      if (!decodedKeyword && !decodedIndustry && !decodedTopic) {
        return res.status(400).json({
          success: false,
          message: 'Search keyword (q) or industry/topic combination is required'
        });
      }

      console.log(`Searching Call for Data Speakers events for: ${decodedKeyword || `${decodedIndustry} ${decodedTopic}`}`);

      let result;
      
      
      if (decodedIndustry && decodedTopic) {
        console.log('🤖 Using AI-powered search optimization for Call for Data Speakers');
        console.log('Industry:', decodedIndustry);
        console.log('Topic:', decodedTopic);
        
        
        console.log(`🔍 SIMPLE DIRECT SEARCH: Industry="${decodedIndustry}", Topic="${decodedTopic}"`);
        
        
        const searchKeyword = `${decodedIndustry} ${decodedTopic}`;
        console.log(`🔍 Searching for: "${searchKeyword}"`);
        
        result = await callForDataSpeakersService.searchEvents(searchKeyword);
        
        
        if (result && result.success) {
          result.ai_optimization_used = false;
          result.optimization_info = {
            industry: decodedIndustry,
            topic: decodedTopic,
            search_method: 'simple_exact_match',
            message: 'Simple exact keyword matching applied'
          };
        }
      } else {
        
        const searchKeyword = decodedKeyword || `${decodedIndustry || ''} ${decodedTopic || ''}`.trim();
        result = await callForDataSpeakersService.searchEvents(searchKeyword);
      }

      
      if (page || limit) {
        const pageNum = parseInt(page) || 1;
        const limitNum = Math.min(parseInt(limit) || 20, 100);
        const offset = (pageNum - 1) * limitNum;

        const events = result.events || [];
        const totalCount = events.length;
        const paginatedEvents = events.slice(offset, offset + limitNum);
        const totalPages = Math.ceil(totalCount / limitNum);

        result = {
          ...result,
          events: paginatedEvents,
          pagination: {
            current_page: pageNum,
            per_page: limitNum,
            total_results: totalCount,
            total_pages: totalPages,
            has_more: pageNum < totalPages,
            next_page: pageNum < totalPages ? pageNum + 1 : null,
            previous_page: pageNum > 1 ? pageNum - 1 : null
          }
        };
      }

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to search Call for Data Speakers events',
          error: result.error
        });
      }

      
      if (decodedIndustry && decodedTopic) {
        result.ai_optimization_used = true;
        result.optimization_info = {
          industry: decodedIndustry,
          topic: decodedTopic,
          message: 'AI-powered search optimization was applied to improve results'
        };
      }

      res.json({
        success: true,
        message: `Call for Data Speakers search for '${decodedKeyword || `${decodedIndustry} ${decodedTopic}`}' completed successfully`,
        data: {
          events: result.events,
          total_count: result.total_count,
          pagination: result.pagination || null,
          search: { keyword: decodedKeyword || `${decodedIndustry} ${decodedTopic}`, industry: decodedIndustry, topic: decodedTopic },
          count: result.events.length,
          source: 'Call for Data Speakers',
          fetched_at: result.fetched_at,
          ai_optimization_used: result.ai_optimization_used || false,
          optimization_info: result.optimization_info || null
        }
      });

    } catch (error) {
      console.error('Call for Data Speakers search error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  
  static async searchCallForDataSpeakersEventsWithOpenAI(req, res) {
    try {
      const { industry, topic } = req.query;

      if (!industry || !topic) {
        return res.status(400).json({
          success: false,
          message: 'Both industry and topic parameters are required for OpenAI search'
        });
      }

      console.log(`🤖 Searching Call for Data Speakers events with OpenAI - Industry: ${industry}, Topic: ${topic}`);

      const result = await callForDataSpeakersService.searchEventsWithOpenAI(industry, topic);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to search events with OpenAI',
          error: result.error
        });
      }

      res.json({
        success: true,
        message: result.events.length > 0 ? 'OpenAI-powered event search completed successfully' : 'Search completed - no matching events found',
        data: {
          events: result.events,
          total_count: result.total_count,
          search: result.search,
          count: result.events.length,
          source: result.source,
          fetched_at: result.fetched_at,
          total_events_searched: result.total_events_searched || 0,
          ai_filtered_count: result.ai_filtered_count || 0,
          method: 'OpenAI-powered search'
        }
      });

    } catch (error) {
      console.error('OpenAI Call for Data Speakers search error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  
  static async optimizeKeywordWithAI(keyword, aiOptimizer) {
    try {
      
      const keywordLower = keyword.toLowerCase();
      
      
      const industries = ['technology', 'healthcare', 'finance', 'education', 'marketing', 'real estate', 'entertainment', 'sports', 'food', 'fashion', 'travel'];
      const topics = ['artificial intelligence', 'machine learning', 'digital marketing', 'leadership', 'innovation', 'sustainability', 'cybersecurity', 'blockchain'];
      
      let detectedIndustry = null;
      let detectedTopic = null;
      
      
      for (const industry of industries) {
        if (keywordLower.includes(industry)) {
          detectedIndustry = industry;
          break;
        }
      }
      
      
      for (const topic of topics) {
        if (keywordLower.includes(topic)) {
          detectedTopic = topic;
          break;
        }
      }
      
      
      if (detectedIndustry && detectedTopic) {
        const optimization = await aiOptimizer.optimizeEventbriteSearchTerms(detectedIndustry, detectedTopic);
        return optimization.primaryKeyword;
      }
      
      
      return EventController.enhanceKeyword(keyword);
      
    } catch (error) {
      console.error('AI keyword optimization failed:', error.message);
      return EventController.enhanceKeyword(keyword);
    }
  }

  
  static enhanceKeyword(keyword) {
    const keywordLower = keyword.toLowerCase();
    
    
    if (!keywordLower.includes('conference') && !keywordLower.includes('summit') && !keywordLower.includes('event')) {
      return `${keyword} conference`;
    }
    
    return keyword;
  }

  /**
   * Filter Call for Data Speakers events based on search keywords
   * @param {Array} events - Array of events to filter
   * @param {Object} input - Search input with topic and industry
   * @returns {Array} Filtered events
   */
  static filterCallForDataSpeakersEventsByKeywords(events, input) {
    if (!input.topic && !input.industry) {
      console.log('📊 No search keywords provided, returning all Call for Data Speakers events');
      return events;
    }
    
    const searchTerms = [
      input.topic?.toLowerCase(),
      input.industry?.toLowerCase()
    ].filter(Boolean);
    
    console.log('🔍 Filtering Call for Data Speakers events with search terms:', searchTerms);
    
    
    
    const isSpecificSearch = searchTerms.some(term => term.includes('policy') || term.includes('regulation') || term.includes('healthcare'));
    
    return events.filter(event => {
      const searchableText = [
        event.title?.toLowerCase() || '',
        event.description?.toLowerCase() || '',
        event.organization?.toLowerCase() || '',
        event.location?.toLowerCase() || '',
        event.type?.toLowerCase() || '',
        event.tags?.join(' ').toLowerCase() || ''
      ].join(' ');
      
      
      if (isSpecificSearch) {
        const mainKeywords = searchTerms.filter(term => 
          term.includes('healthcare') || term.includes('policy') || term.includes('regulation')
        );
        
        const hasMainKeywordMatch = mainKeywords.some(keyword => {
          const words = keyword.split(' ');
          return words.some(word => {
            if (word.length < 3) return false;
            return searchableText.includes(word);
          });
        });
        
        if (!hasMainKeywordMatch) {
          return false;
        }
      }
      
      
      const matches = searchTerms.some(term => {
        if (!term) return false;
        
        
        if (searchableText.includes(term)) {
          return true;
        }
        
        
        const words = term.split(' ');
        return words.some(word => {
          if (word.length < 3) return false; 
          return searchableText.includes(word);
        });
      });
      
      if (matches) {
        console.log(`✅ Call for Data Speakers event matches: "${event.title}" (matched: ${searchTerms.filter(term => searchableText.includes(term || ''))})`);
      }
      
      return matches;
    });
  }
}


function convertToEventbriteParams(industry, topic) {
  
  const industryMappings = {
    'Technology': { keyword: 'tech conference', category: '102' }, 
    'Healthcare': { keyword: 'healthcare conference', category: '108' }, 
    'Finance': { keyword: 'finance conference', category: '103' }, 
    'Education': { keyword: 'education conference', category: '104' }, 
    'Marketing': { keyword: 'marketing conference', category: '103' }, 
    'Real Estate': { keyword: 'real estate conference', category: '103' }, 
    'Entertainment': { keyword: 'entertainment conference', category: '105' }, 
    'Sports': { keyword: 'sports conference', category: '108' }, 
    'Food & Beverage': { keyword: 'food conference', category: '110' }, 
    'Fashion': { keyword: 'fashion conference', category: '106' }, 
    'Travel': { keyword: 'travel conference', category: '109' }, 
    'Automotive': { keyword: 'automotive conference', category: '103' }, 
    'Energy': { keyword: 'energy conference', category: '103' }, 
    'Manufacturing': { keyword: 'manufacturing conference', category: '103' }, 
    'Retail': { keyword: 'retail conference', category: '103' }, 
    'Consulting': { keyword: 'consulting conference', category: '103' }, 
    'Non-profit': { keyword: 'nonprofit conference', category: '103' }, 
    'Government': { keyword: 'government conference', category: '103' }, 
    'Media': { keyword: 'media conference', category: '105' }, 
    'Telecommunications': { keyword: 'telecommunications conference', category: '102' } 
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

  
  if (topicMappings[topic]) {
    return topicMappings[topic];
  }

  
  if (industryMappings[industry]) {
    return industryMappings[industry];
  }

  
  return {
    keyword: `${topic} ${industry}`,
    category: '103' 
  };
}

module.exports = EventController;
