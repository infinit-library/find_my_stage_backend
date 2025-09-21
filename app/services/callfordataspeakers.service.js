const axios = require('axios');

class CallForDataSpeakersService {
  constructor() {
    this.baseUrl = 'https://callfordataspeakers.com/api';
    this.timeout = 30000;
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.openaiBaseUrl = 'https://api.openai.com/v1';
  }

 
  async getRawEvents() {
    try {
      const url = `${this.baseUrl}/events`;
      console.log(`🔍 FETCHING EVENTS from: ${url}`);
      
      const response = await axios.get(url, {
        timeout: this.timeout,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'CallForDataSpeakers-API-Client/1.0'
        }
      });

      console.log(`📊 RAW API RESPONSE: ${response.data?.length || 0} events received`);
      if (response.data && response.data.length > 0) {
        console.log(`📋 FIRST EVENT SAMPLE:`, {
          name: response.data[0].EventName,
          info: response.data[0].Information?.substring(0, 100) + '...'
        });
      }

      return {
        success: true,
        events: response.data,
        total_count: response.data?.length || 0
      };

    } catch (error) {
      console.error('Call for Data Speakers API Error:', error.message);

      if (error.response) {
        console.error('Call for Data Speakers Response Error:', {
          status: error.response.status,
          data: error.response.data,
          url
        });
        
        let errorMessage = 'Failed to fetch events from Call for Data Speakers';
        if (error.response.status === 404) {
          errorMessage = 'Events endpoint not found';
        } else if (error.response.status === 429) {
          errorMessage = 'Rate limit exceeded. Please try again later.';
        } else if (error.response.status >= 500) {
          errorMessage = 'Server error from Call for Data Speakers API';
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        }

        return {
          success: false,
          error: errorMessage,
          status: error.response.status
        };
      } else if (error.request) {
        return {
          success: false,
          error: 'No response from Call for Data Speakers API. Please check your internet connection.'
        };
      } else {
        return {
          success: false,
          error: `Request setup error: ${error.message}`
        };
      }
    }
  }


  async getEvents(params = {}) {
    const rawResult = await this.getRawEvents();
    
    if (!rawResult.success) {
      return rawResult;
    }

    return {
      success: true,
      events: this.formatEvents(rawResult.events),
      total_count: rawResult.total_count,
      source: 'Call for Data Speakers',
      fetched_at: new Date().toISOString()
    };
  }


  async getEventsPaginated(params = {}) {
    try {
      const page = parseInt(params.page) || 1;
      const limit = Math.min(parseInt(params.limit) || 20, 100); 
      const offset = (page - 1) * limit;

      console.log(`Call for Data Speakers: Fetching page ${page}, limit ${limit}, offset ${offset}`);

      const result = await this.getEvents();
      
      if (!result.success) {
        return result;
      }

      const allEvents = result.events || [];
      const totalCount = allEvents.length;
      const paginatedEvents = allEvents.slice(offset, offset + limit);
      const totalPages = Math.ceil(totalCount / limit);

      return {
        success: true,
        events: paginatedEvents,
        pagination: {
          current_page: page,
          per_page: limit,
          total_results: totalCount,
          total_pages: totalPages,
          has_more: page < totalPages,
          next_page: page < totalPages ? page + 1 : null,
          previous_page: page > 1 ? page - 1 : null
        },
        source: 'Call for Data Speakers',
        fetched_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('Call for Data Speakers pagination error:', error.message);
      return {
        success: false,
        error: `Pagination failed: ${error.message}`
      };
    }
  }

  async getEventsByRegion(region) {
    try {
      const rawResult = await this.getRawEvents();
      
      if (!rawResult.success) {
        return rawResult;
      }

      const filteredRawEvents = rawResult.events.filter(event => 
        event.Regions && event.Regions.toLowerCase() === region.toLowerCase()
      );

      return {
        success: true,
        events: this.formatEvents(filteredRawEvents),
        total_count: filteredRawEvents.length,
        filter: { region },
        source: 'Call for Data Speakers',
        fetched_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('Call for Data Speakers region filter error:', error.message);
      return {
        success: false,
        error: `Region filter failed: ${error.message}`
      };
    }
  }

  async getEventsByStatus(status) {
    try {
      const rawResult = await this.getRawEvents();
      
      if (!rawResult.success) {
        return rawResult;
      }

      const filteredRawEvents = rawResult.events.filter(event => {
        const eventStatus = this.determineStatus(event.Cfs_Closes);
        return eventStatus.toLowerCase() === status.toLowerCase();
      });

      return {
        success: true,
        events: this.formatEvents(filteredRawEvents),
        total_count: filteredRawEvents.length,
        filter: { status },
        source: 'Call for Data Speakers',
        fetched_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('Call for Data Speakers status filter error:', error.message);
      return {
        success: false,
        error: `Status filter failed: ${error.message}`
      };
    }
  }


  async searchEvents(keyword) {
    try {
      if (!keyword || typeof keyword !== 'string') {
        return {
          success: false,
          error: 'Search keyword is required and must be a string'
        };
      }

      
      const rawResult = await this.getRawEvents();
      
      if (!rawResult.success) {
        return rawResult;
      }

      const searchTerm = keyword.toLowerCase().trim();
      console.log(`🔍 EXACT SEARCH for keyword: "${searchTerm}"`);
      
      
      const filteredRawEvents = rawResult.events.filter(event => {
        const eventName = (event.EventName || '').toLowerCase();
        const eventInfo = (event.Information || '').toLowerCase();
        const eventType = (event.EventType || '').toLowerCase();
        const eventVenue = (event.Venue || '').toLowerCase();
        
        
        const hasMatch = eventName.includes(searchTerm) || 
                        eventInfo.includes(searchTerm) || 
                        eventType.includes(searchTerm) || 
                        eventVenue.includes(searchTerm);
        
        if (hasMatch) {
          console.log(`✅ EXACT MATCH: "${event.EventName}" contains "${searchTerm}"`);
        }
        
        return hasMatch;
      });
      
      console.log(`📊 EXACT SEARCH RESULTS: ${filteredRawEvents.length} events found containing "${searchTerm}"`);

      return {
        success: true,
        events: this.formatEvents(filteredRawEvents),
        total_count: filteredRawEvents.length,
        search: { keyword },
        source: 'Call for Data Speakers',
        fetched_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('Call for Data Speakers search error:', error.message);
      return {
        success: false,
        error: `Search failed: ${error.message}`
      };
    }
  }

  async getEventStats() {
    try {
      const result = await this.getEvents();
      
      if (!result.success) {
        return result;
      }

      const events = result.events || [];
      
      
      const stats = {
        total_events: events.length,
        region_counts: {},
        status_counts: {},
        type_counts: {},
        recent_events: 0,
        upcoming_events: 0
      };

      const currentDate = new Date();

      events.forEach(event => {
        
        if (event.Regions) {
          stats.region_counts[event.Regions] = (stats.region_counts[event.Regions] || 0) + 1;
        }
        
        
        const status = this.determineStatus(event.Cfs_Closes);
        stats.status_counts[status] = (stats.status_counts[status] || 0) + 1;
        
        
        if (event.EventType) {
          stats.type_counts[event.EventType] = (stats.type_counts[event.EventType] || 0) + 1;
        }

        
        if (event.Created) {
          const createdDate = new Date(event.Created);
          const daysDiff = (currentDate - createdDate) / (1000 * 60 * 60 * 24);
          if (daysDiff <= 30) {
            stats.recent_events++;
          }
        }

        
        if (event.Cfs_Closes) {
          const deadlineDate = new Date(event.Cfs_Closes);
          if (deadlineDate > currentDate) {
            stats.upcoming_events++;
          }
        }
      });

      return {
        success: true,
        statistics: stats,
        generated_at: new Date().toISOString(),
        source: 'Call for Data Speakers'
      };

    } catch (error) {
      console.error('Call for Data Speakers stats error:', error.message);
      return {
        success: false,
        error: `Statistics generation failed: ${error.message}`
      };
    }
  }


  isEventExpired(event) {
    
    const eventDate = event.Date || event.event_date || event.start_date;
    const deadline = event.Cfs_Closes || event.deadline || event.submission_deadline;
    
    
    if (!eventDate && !deadline) {
      return false;
    }
    
    
    const dateToCheck = eventDate || deadline;
    const eventDateTime = new Date(dateToCheck);
    const now = new Date();
    
    
    const oneDayInMs = 24 * 60 * 60 * 1000;
    return eventDateTime.getTime() < (now.getTime() - oneDayInMs);
  }

  formatEvents(eventsData) {
    if (!eventsData || !Array.isArray(eventsData)) return [];

    
    const activeEvents = eventsData.filter(event => !this.isEventExpired(event));
    console.log(`📅 Filtered out ${eventsData.length - activeEvents.length} expired events from Call for Data Speakers`);

    return activeEvents.map(event => ({
      id: event.id || event.event_id || null,
      title: event.EventName || event.title || event.name || 'Untitled Event',
      description: event.Information || event.description || '',
      organization: event.organization || event.organizer || '',
      website: event.URL || event.website || event.url || '',
      deadline: event.Cfs_Closes || event.deadline || event.submission_deadline || null,
      event_date: event.Date || event.event_date || event.start_date || null,
      end_date: event.EndDate || event.end_date || null,
      location: event.Venue || event.location || '',
      region: event.Regions || event.region || '',
      type: event.EventType || event.type || event.event_type || '',
      status: this.determineStatus(event.Cfs_Closes || event.deadline || event.submission_deadline),
      tags: event.tags || event.categories || [],
      contact_email: event.Email || event.contact_email || event.email || '',
      created_at: event.Created || event.created_at || event.published_at || null,
      updated_at: event.updated_at || event.modified_at || null,
      source: 'Call for Data Speakers',
      
      is_upcoming: this.isUpcoming(event.Cfs_Closes || event.deadline || event.submission_deadline),
      days_until_deadline: this.getDaysUntilDeadline(event.Cfs_Closes || event.deadline || event.submission_deadline),
      urgency_level: this.getUrgencyLevel(event.Cfs_Closes || event.deadline || event.submission_deadline),
      
      latitude: event.Lat || null,
      longitude: event.Long || null
    }));
  }

  isUpcoming(deadline) {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const currentDate = new Date();
    return deadlineDate > currentDate;
  }

  getDaysUntilDeadline(deadline) {
    if (!deadline) return null;
    const deadlineDate = new Date(deadline);
    const currentDate = new Date();
    const timeDiff = deadlineDate - currentDate;
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  }

  getUrgencyLevel(deadline) {
    const days = this.getDaysUntilDeadline(deadline);
    if (days === null) return 'unknown';
    if (days < 0) return 'expired';
    if (days <= 7) return 'urgent';
    if (days <= 30) return 'soon';
    return 'normal';
  }


  determineStatus(deadline) {
    if (!deadline) return 'unknown';
    const days = this.getDaysUntilDeadline(deadline);
    if (days === null) return 'unknown';
    if (days < 0) return 'closed';
    if (days <= 30) return 'urgent';
    return 'open';
  }

  async searchEventsWithOpenAI(industry, topic) {
    try {
      
      if (!this.openaiApiKey) {
        return {
          success: false,
          error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.',
          source: 'OpenAI'
        };
      }

      console.log(`🤖 Fetching real events from callfordataspeakers.com for industry: ${industry}, topic: ${topic}`);

      
      const rawEventsResult = await this.getRawEvents();
      
      if (!rawEventsResult.success) {
        return {
          success: false,
          error: `Failed to fetch events from callfordataspeakers.com: ${rawEventsResult.error}`,
          source: 'OpenAI + Call for Data Speakers'
        };
      }

      const rawEvents = rawEventsResult.events || [];
      console.log(`📊 Found ${rawEvents.length} total events from callfordataspeakers.com`);

      if (rawEvents.length === 0) {
        return {
          success: true,
          events: [],
          total_count: 0,
          search: { industry, topic },
          source: 'OpenAI + Call for Data Speakers',
          fetched_at: new Date().toISOString()
        };
      }

      
      const filteredEvents = await this.filterEventsWithOpenAI(rawEvents, industry, topic);
      
      return {
        success: true,
        events: filteredEvents,
        total_count: filteredEvents.length,
        search: { industry, topic },
        source: 'OpenAI + Call for Data Speakers',
        fetched_at: new Date().toISOString(),
        total_events_searched: rawEvents.length,
        ai_filtered_count: filteredEvents.length
      };

    } catch (error) {
      console.error('OpenAI event search failed:', error.message);
      
      if (error.response) {
        console.error('OpenAI API Error:', {
          status: error.response.status,
          data: error.response.data
        });
      }

      return {
        success: false,
        error: `OpenAI search failed: ${error.message}`,
        source: 'OpenAI'
      };
    }
  }

  /**
   * Filter real events using OpenAI based on industry and topic
   * @param {Array} events - Real events from callfordataspeakers.com
   * @param {string} industry - The industry to filter by
   * @param {string} topic - The topic to filter by
   * @returns {Promise<Array>} - Filtered and formatted events
   */
  async filterEventsWithOpenAI(events, industry, topic) {
    try {
      
      const eventsForAI = events.map((event, index) => ({
        id: index + 1,
        title: event.EventName || event.title || 'Untitled Event',
        description: event.Information || event.description || '',
        organization: event.organization || event.organizer || '',
        venue: event.Venue || event.venue || '',
        location: event.Venue || event.location || '',
        region: event.Regions || event.region || '',
        type: event.EventType || event.type || '',
        deadline: event.Cfs_Closes || event.deadline || null,
        event_date: event.Date || event.event_date || null,
        website: event.URL || event.website || ''
      }));

      const prompt = this.createEventFilteringPrompt(eventsForAI, industry, topic);
      
      const response = await axios.post(
        `${this.openaiBaseUrl}/chat/completions`,
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are an expert at matching events to specific industries and topics. Given a list of real events from callfordataspeakers.com, you need to identify which events are most relevant to the specified industry and topic. Respond with a JSON array of event IDs that match the criteria, sorted by relevance (most relevant first)."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.2
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const aiResponse = response.data.choices[0].message.content;
      const matchedEventIds = this.parseEventIdsFromAI(aiResponse);
      
      console.log(`🎯 OpenAI identified ${matchedEventIds.length} relevant events out of ${events.length} total`);

      
      const filteredEvents = [];
      matchedEventIds.forEach(eventId => {
        const originalIndex = eventId - 1; 
        if (originalIndex >= 0 && originalIndex < events.length) {
          const originalEvent = events[originalIndex];
          
          
          if (this.isEventRelevant(originalEvent, industry, topic)) {
            const formattedEvent = this.formatEvents([originalEvent])[0];
            
            
            formattedEvent.ai_matched = true;
            formattedEvent.search_industry = industry;
            formattedEvent.search_topic = topic;
            formattedEvent.relevance_rank = filteredEvents.length + 1;
            
            filteredEvents.push(formattedEvent);
          } else {
            console.log(`⚠️ Skipping event "${originalEvent.EventName || originalEvent.title}" - doesn't match criteria after validation`);
          }
        }
      });

      console.log(`✅ Final validation: ${filteredEvents.length} events passed strict matching criteria`);
      return filteredEvents;

    } catch (error) {
      console.error('OpenAI event filtering failed:', error.message);
      
      
      console.log('❌ OpenAI filtering failed - returning empty results to avoid incorrect matches');
      return [];
    }
  }

  createEventFilteringPrompt(events, industry, topic) {
    const eventsList = events.map(event => 
      `ID: ${event.id}\nTitle: ${event.title}\nDescription: ${event.description}\nOrganization: ${event.organization}\nVenue: ${event.venue}\nType: ${event.type}\n---`
    ).join('\n');

    return `
You are an extremely strict event matching expert. Analyze these real events from callfordataspeakers.com and find ONLY the events that have an EXACT, OBVIOUS connection to:

Industry: "${industry}"
Topic: "${topic}"

Events to analyze:
${eventsList}

CRITICAL RULES - BE EXTREMELY STRICT:
1. The event MUST be obviously and directly about BOTH the industry AND the topic
2. SQL Server, database, or data platform events do NOT match "Business + Digital Transformation"
3. General tech conferences do NOT match specific industry topics
4. Only return events where the title/description explicitly mentions the industry and topic combination
5. If you have ANY doubt about relevance, do NOT include the event
6. It's better to return an empty array than incorrect matches

EXAMPLES OF WHAT NOT TO MATCH:
- "SQL Server User Group" for "Business + Digital Transformation" ❌
- "Data Platform Conference" for "Healthcare + Medical Devices" ❌  
- "General Tech Summit" for "Finance + Blockchain" ❌
- Any database/SQL events for non-data topics ❌

EXAMPLES OF VALID MATCHES:
- "Healthcare + Medical Device Innovation": Medical device conferences, healthcare technology events
- "Finance + Fintech": Financial technology conferences, banking innovation events
- "Business + Digital Transformation": Business transformation conferences, digital business events

If NO events have an obvious, direct connection to the industry + topic combination, return an empty array: []

Please respond with ONLY a JSON array of event IDs that have an OBVIOUS, DIRECT connection. If uncertain, return: []

Return only the JSON array, no other text.
`;
  }


  parseEventIdsFromAI(aiResponse) {
    try {
      
      const jsonMatch = aiResponse.match(/\[[\d,\s]*\]/);
      if (jsonMatch) {
        const ids = JSON.parse(jsonMatch[0]);
        if (Array.isArray(ids)) {
          
          const validIds = ids.filter(id => 
            typeof id === 'number' && 
            id > 0 && 
            id <= 1000 
          );
          console.log(`🎯 Parsed ${validIds.length} valid event IDs from AI response`);
          return validIds;
        }
      }
      
      
      console.log('⚠️ No valid JSON array found in AI response - returning empty results');
      return [];
      
    } catch (error) {
      console.error('Failed to parse AI response:', error.message);
      console.log('⚠️ Parse error - returning empty results to avoid incorrect matches');
      return [];
    }
  }
  isSearchRelevantForDataSpeakers(industry, topic) {

    return { 
      isRelevant: true, 
      reason: 'Search allowed - will return exact matches only' 
    };
  }

  isEventRelevant(event, industry, topic) {
    const title = (event.EventName || event.title || '').toLowerCase();
    const description = (event.Information || event.description || '').toLowerCase();
    
    const industryLower = industry.toLowerCase().trim();
    const topicLower = topic.toLowerCase().trim();
  
    
    const hasIndustryMatch = title.includes(industryLower) || description.includes(industryLower);
    const hasTopicMatch = title.includes(topicLower) || description.includes(topicLower);
    
    const isRelevant = hasIndustryMatch && hasTopicMatch;
    
    if (isRelevant) {
      console.log(`EXACT MATCH: "${title}" contains both "${industryLower}" and "${topicLower}"`);
    } else {
      console.log(` NO MATCH: "${title}" - Industry: ${hasIndustryMatch}, Topic: ${hasTopicMatch}`);
    }
    
    return isRelevant;
  }

  parseDate(dateStr) {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return null;
      }
      return date.toISOString();
    } catch (error) {
      return null;
    }
  }

  extractRegion(location) {
    if (!location) return '';
    const locationLower = location.toLowerCase();
    if (locationLower.includes('europe')) return 'Europe';
    if (locationLower.includes('north america') || locationLower.includes('usa') || locationLower.includes('canada')) return 'North America';
    if (locationLower.includes('asia')) return 'Asia';
    if (locationLower.includes('virtual') || locationLower.includes('online')) return 'Virtual';
    if (locationLower.includes('africa')) return 'Africa';
    if (locationLower.includes('oceania') || locationLower.includes('australia')) return 'Oceania';
    if (locationLower.includes('south america')) return 'South America';
    return 'Unknown';
  }
}

module.exports = new CallForDataSpeakersService();
