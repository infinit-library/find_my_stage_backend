const PaymentHistoryModel = require('../models/paymenthistory.model');

class PaymentHistoryController {
  // Get payment history
  static async getPaymentHistory(req, res) {
    try {
      const { page = 1, limit = 10, ...filters } = req.query;
      const userId = req.user.id;

      const result = await PaymentHistoryModel.findByUser(
        userId,
        parseInt(page),
        parseInt(limit)
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get payment history error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get payment by ID
  static async getPaymentById(req, res) {
    try {
      const { id } = req.params;
      const payment = await PaymentHistoryModel.findById(id);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      // Check if user owns this payment
      if (payment.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: payment
      });
    } catch (error) {
      console.error('Get payment by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get payment statistics
  static async getPaymentStats(req, res) {
    try {
      const userId = req.user.id;
      const { startDate, endDate } = req.query;

      const stats = await PaymentHistoryModel.getStats(
        userId,
        startDate,
        endDate
      );

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get payment stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Create payment record (for webhook or manual creation)
  static async createPayment(req, res) {
    try {
      const paymentData = {
        ...req.body,
        userId: req.user.id
      };

      const payment = await PaymentHistoryModel.create(paymentData);

      res.status(201).json({
        success: true,
        message: 'Payment record created successfully',
        data: payment
      });
    } catch (error) {
      console.error('Create payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update payment status
  static async updatePaymentStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, ...additionalData } = req.body;

      const payment = await PaymentHistoryModel.findById(id);
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      // Check if user owns this payment
      if (payment.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const updatedPayment = await PaymentHistoryModel.updateStatus(
        id,
        status,
        additionalData
      );

      res.json({
        success: true,
        message: 'Payment status updated successfully',
        data: updatedPayment
      });
    } catch (error) {
      console.error('Update payment status error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get all payments (admin only)
  static async getAllPayments(req, res) {
    try {
      const { page = 1, limit = 10, ...filters } = req.query;

      const result = await PaymentHistoryModel.findAll(
        parseInt(page),
        parseInt(limit),
        filters
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get all payments error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get recent payments (admin only)
  static async getRecentPayments(req, res) {
    try {
      const { limit = 10 } = req.query;
      const payments = await PaymentHistoryModel.getRecent(parseInt(limit));

      res.json({
        success: true,
        data: payments
      });
    } catch (error) {
      console.error('Get recent payments error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get payment statistics (admin only)
  static async getAdminPaymentStats(req, res) {
    try {
      const { startDate, endDate } = req.query;

      const stats = await PaymentHistoryModel.getStats(
        null, // No user filter for admin stats
        startDate,
        endDate
      );

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get admin payment stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = PaymentHistoryController;
