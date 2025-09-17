const prisma = require('./index');

class UserModel {
  // Create a new user
  static async create(userData) {
    try {
      // Check for duplicate email
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        throw new Error("Email already exists. Please use another email.");
      }

      const user = await prisma.user.create({
        data: userData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          profilePicture: true,
          isEmailVerified: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return user;
    } catch (error) {
      console.error("Signup error:", error.message);
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      return await prisma.user.findUnique({
        where: { email },
        include: { userTopics: true, events: true, paymentHistory: true },
      });
    } catch (error) {
      console.error("Find user error:", error.message);
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          userTopics: true,
          events: true,
          paymentHistory: true
        }
      });
      return user;
    } catch (error) {
      throw error;
    }
  }

  // Update user
  static async update(id, updateData) {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          profilePicture: true,
          isEmailVerified: true,
          status: true,
          updatedAt: true
        }
      });
      return user;
    } catch (error) {
      throw error;
    }
  }

  // Delete user
  static async delete(id) {
    try {
      await prisma.user.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Get all users with pagination
  static async findAll(page = 1, limit = 10, search = '') {
    try {
      const skip = (page - 1) * limit;
      const where = search ? {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      } : {};

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
            isEmailVerified: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where })
      ]);

      return {
        users,
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

  // Verify user email
  static async verifyEmail(id) {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: { isEmailVerified: true },
        select: {
          id: true,
          email: true,
          isEmailVerified: true
        }
      });
      return user;
    } catch (error) {
      throw error;
    }
  }

  // Deactivate user
  static async deactivate(id) {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: { status: "inactive" },
        select: {
          id: true,
          email: true,
          status: true
        }
      });
      return user;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserModel;
