const prisma = require('./index');

class EventModel {
  // Create a new event
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
          topics: true
        }
      });
      return event;
    } catch (error) {
      throw error;
    }
  }

  // Find event by ID
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
          topics: true,
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

  // Get all events with pagination and filters
  static async findAll(page = 1, limit = 10, filters = {}) {
    try {
      const skip = (page - 1) * limit;
      const where = {};

      // Apply filters
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

      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
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
            topics: true,
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

  // Update event
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
          topics: true
        }
      });
      return event;
    } catch (error) {
      throw error;
    }
  }

  // Delete event
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

  // Get events by organizer
  static async findByOrganizer(organizerId, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      const [events, total] = await Promise.all([
        prisma.event.findMany({
          where: { organizerId },
          skip,
          take: limit,
          include: {
            topics: true,
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

  // Add speaker to event
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

  // Remove speaker from event
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

  // Get upcoming events
  static async getUpcoming(limit = 10) {
    try {
      const events = await prisma.event.findMany({
        where: {
          startDate: { gte: new Date() },
          isActive: true
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
          topics: true,
          _count: {
            select: { speakers: true }
          }
        },
        orderBy: { startDate: 'asc' }
      });
      return events;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = EventModel;
