const prisma = require('./index');

class TopicModel {
  
  static async create(topicData) {
    try {
      const topic = await prisma.topic.create({
        data: topicData,
        include: {
          users: {
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
      return topic;
    } catch (error) {
      throw error;
    }
  }

  
  static async findById(id) {
    try {
      const topic = await prisma.topic.findUnique({
        where: { id },
        include: {
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profilePicture: true
            }
          },
          events: {
            include: {
              organizer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profilePicture: true
                }
              }
            }
          }
        }
      });
      return topic;
    } catch (error) {
      throw error;
    }
  }

  
  static async findByName(name) {
    try {
      const topic = await prisma.topic.findFirst({
        where: { 
          name: { 
            equals: name, 
            mode: 'insensitive' 
          } 
        },
        include: {
          users: {
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
      return topic;
    } catch (error) {
      throw error;
    }
  }

  
  static async findAll(page = 1, limit = 10, search = '') {
    try {
      const skip = (page - 1) * limit;
      const where = search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      } : {};

      const [topics, total] = await Promise.all([
        prisma.topic.findMany({
          where,
          skip,
          take: limit,
          include: {
            _count: {
              select: { 
                users: true,
                events: true
              }
            }
          },
          orderBy: { name: 'asc' }
        }),
        prisma.topic.count({ where })
      ]);

      return {
        topics,
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
      const topic = await prisma.topic.update({
        where: { id },
        data: updateData,
        include: {
          users: {
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
      return topic;
    } catch (error) {
      throw error;
    }
  }

  
  static async delete(id) {
    try {
      await prisma.topic.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      throw error;
    }
  }

  
  static async addUser(topicId, userId) {
    try {
      const topicUser = await prisma.topicUser.create({
        data: {
          topicId,
          userId
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
          },
          topic: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        }
      });
      return topicUser;
    } catch (error) {
      throw error;
    }
  }

  
  static async removeUser(topicId, userId) {
    try {
      await prisma.topicUser.deleteMany({
        where: {
          topicId,
          userId
        }
      });
      return true;
    } catch (error) {
      throw error;
    }
  }

  
  static async findByUser(userId) {
    try {
      const topics = await prisma.topic.findMany({
        where: {
          users: {
            some: {
              userId
            }
          }
        },
        include: {
          _count: {
            select: { 
              users: true,
              events: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });
      return topics;
    } catch (error) {
      throw error;
    }
  }

  
  static async getPopular(limit = 10) {
    try {
      const topics = await prisma.topic.findMany({
        include: {
          _count: {
            select: { 
              users: true,
              events: true
            }
          }
        },
        orderBy: {
          users: {
            _count: 'desc'
          }
        },
        take: limit
      });
      return topics;
    } catch (error) {
      throw error;
    }
  }

  
  static async search(query, limit = 10) {
    try {
      const topics = await prisma.topic.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
          ]
        },
        include: {
          _count: {
            select: { 
              users: true,
              events: true
            }
          }
        },
        orderBy: { name: 'asc' },
        take: limit
      });
      return topics;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = TopicModel;
