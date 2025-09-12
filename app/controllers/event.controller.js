const EventModel = require('../models/event.model');
const ticketmasterService = require('../services/ticketmaster.service');

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

  // Get Ticketmaster events
  static async getTicketmasterEvents(req, res) {
    try {
      const {
        q: keyword,
        city,
        country = 'US',
        size,
        num = 100, 
        page = 0
      } = req.query;

      if (!keyword) {
        return res.status(400).json({
          success: false,
          message: 'Search query (q) is required'
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

      console.log('Searching Ticketmaster events with params:', searchParams);

      // Use pagination for requests > 20 events (lowered threshold), regular search for <= 20
      let result;
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

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch Ticketmaster events',
          error: result.error
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
}

module.exports = EventController;
