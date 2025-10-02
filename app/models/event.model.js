const prisma = require('./index');

class EventModel {
  
  static async create(eventData) {
    try {
      const event = await prisma.event.create({
        data: eventData,
        include: {
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profilePicture: true
            }
          },
          topic: true
        }
      });
      return event;
    } catch (error) {
      throw error;
    }
  }

  
  static async findById(id) {
    try {
      const event = await prisma.event.findUnique({
        where: { id },
        include: {
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profilePicture: true
            }
          },
          topic: true,
          speakers: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  profilePicture: true
                }
              }
            }
          }
        }
      });
      return event;
    } catch (error) {
      throw error;
    }
  }

  
  static async findAll(page = 1, limit = 10, filters = {}) {
    try {
      const skip = (page - 1) * limit;
      const where = {};

      
      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { location: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      if (filters.location) {
        where.location = { contains: filters.location, mode: 'insensitive' };
      }

      if (filters.eventType) {
        where.eventType = filters.eventType;
      }

      if (filters.startDate) {
        where.startDate = { gte: new Date(filters.startDate) };
      }

      if (filters.endDate) {
        where.endDate = { lte: new Date(filters.endDate) };
      }

      if (filters.status !== undefined) {
        where.status = filters.status;
      }

      const [events, total] = await Promise.all([
        prisma.event.findMany({
          where,
          skip,
          take: limit,
          include: {
            organizer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePicture: true
              }
            },
            topic: true,
            _count: {
              select: { speakers: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.event.count({ where })
      ]);

      return {
        events,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  
  static async update(id, updateData) {
    try {
      const event = await prisma.event.update({
        where: { id },
        data: updateData,
        include: {
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profilePicture: true
            }
          },
          topic: true
        }
      });
      return event;
    } catch (error) {
      throw error;
    }
  }

  
  static async delete(id) {
    try {
      await prisma.event.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      throw error;
    }
  }

  
  static async findByOrganizer(organizerId, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      const [events, total] = await Promise.all([
        prisma.event.findMany({
          where: { organizerId },
          skip,
          take: limit,
          include: {
            topic: true,
            _count: {
              select: { speakers: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.event.count({ where: { organizerId } })
      ]);

      return {
        events,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  
  static async addSpeaker(eventId, userId, speakerData = {}) {
    try {
      const speaker = await prisma.eventSpeaker.create({
        data: {
          eventId,
          userId,
          ...speakerData
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profilePicture: true
            }
          }
        }
      });
      return speaker;
    } catch (error) {
      throw error;
    }
  }

  
  static async removeSpeaker(eventId, userId) {
    try {
      await prisma.eventSpeaker.deleteMany({
        where: {
          eventId,
          userId
        }
      });
      return true;
    } catch (error) {
      throw error;
    }
  }

  
  static async getUpcoming(limit = 10) {
    try {
      const events = await prisma.event.findMany({
        where: {
          date: { gte: new Date() },
          status: "UPCOMING"
        },
        take: limit,
        include: {
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true
            }
          },
          topic: true,
          _count: {
            select: { speakers: true }
          }
        },
        orderBy: { date: 'asc' }
      });
      return events;
    } catch (error) {
      throw error;
    }
  }

  
  static async getLimitedEvents() {
    try {
      const events = await prisma.event.findMany({
        select: {
          title: true,
          date: true,
          location: true,
          eventUrl: true,
          organizer: true
        },
        take: 20,
        orderBy: { createdAt: 'asc' }
      });

      
      const cleanText = (text) => {
        if (!text) return '';
        return text
          .replace(/\n/g, ' ') 
          .replace(/\s+/g, ' ') 
          .trim(); 
      };

      
      const cleanedEvents = events.map(event => ({
        ...event,
        title: cleanText(event.title),
        location: cleanText(event.location),
        organizer: cleanText(event.organizer)
      }));

      return cleanedEvents;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = EventModel;
