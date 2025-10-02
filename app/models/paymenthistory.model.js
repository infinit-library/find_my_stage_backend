const prisma = require('./index');

class PaymentHistoryModel {
  
  static async create(paymentData) {
    try {
      const payment = await prisma.paymentHistory.create({
        data: paymentData,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });
      return payment;
    } catch (error) {
      throw error;
    }
  }

  
  static async findById(id) {
    try {
      const payment = await prisma.paymentHistory.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });
      return payment;
    } catch (error) {
      throw error;
    }
  }

  
  static async findByPaymentIntentId(paymentIntentId) {
    try {
      const payment = await prisma.paymentHistory.findFirst({
        where: { paymentIntentId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });
      return payment;
    } catch (error) {
      throw error;
    }
  }

  
  static async findAll(page = 1, limit = 10, filters = {}) {
    try {
      const skip = (page - 1) * limit;
      const where = {};

      
      if (filters.userId) {
        where.userId = filters.userId;
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.startDate) {
        where.createdAt = { gte: new Date(filters.startDate) };
      }

      if (filters.endDate) {
        where.createdAt = { 
          ...where.createdAt,
          lte: new Date(filters.endDate) 
        };
      }

      const [payments, total] = await Promise.all([
        prisma.paymentHistory.findMany({
          where,
          skip,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.paymentHistory.count({ where })
      ]);

      return {
        payments,
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

  
  static async findByUser(userId, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      const [payments, total] = await Promise.all([
        prisma.paymentHistory.findMany({
          where: { userId },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.paymentHistory.count({ where: { userId } })
      ]);

      return {
        payments,
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

  
  static async updateStatus(id, status, additionalData = {}) {
    try {
      const payment = await prisma.paymentHistory.update({
        where: { id },
        data: {
          status,
          ...additionalData
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });
      return payment;
    } catch (error) {
      throw error;
    }
  }

  
  static async updateByPaymentIntentId(paymentIntentId, updateData) {
    try {
      const payment = await prisma.paymentHistory.updateMany({
        where: { paymentIntentId },
        data: updateData
      });
      return payment;
    } catch (error) {
      throw error;
    }
  }

  
  static async getStats(userId = null, startDate = null, endDate = null) {
    try {
      const where = {};
      
      if (userId) {
        where.userId = userId;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const [
        totalPayments,
        successfulPayments,
        failedPayments,
        totalAmount,
        successfulAmount
      ] = await Promise.all([
        prisma.paymentHistory.count({ where }),
        prisma.paymentHistory.count({ 
          where: { ...where, status: 'succeeded' } 
        }),
        prisma.paymentHistory.count({ 
          where: { ...where, status: 'failed' } 
        }),
        prisma.paymentHistory.aggregate({
          where,
          _sum: { amount: true }
        }),
        prisma.paymentHistory.aggregate({
          where: { ...where, status: 'succeeded' },
          _sum: { amount: true }
        })
      ]);

      return {
        totalPayments,
        successfulPayments,
        failedPayments,
        pendingPayments: totalPayments - successfulPayments - failedPayments,
        totalAmount: totalAmount._sum.amount || 0,
        successfulAmount: successfulAmount._sum.amount || 0,
        successRate: totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0
      };
    } catch (error) {
      throw error;
    }
  }

  
  static async getRecent(limit = 10) {
    try {
      const payments = await prisma.paymentHistory.findMany({
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      return payments;
    } catch (error) {
      throw error;
    }
  }

  
  static async delete(id) {
    try {
      const payment = await prisma.paymentHistory.update({
        where: { id },
        data: { status: 'cancelled' }
      });
      return payment;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = PaymentHistoryModel;
