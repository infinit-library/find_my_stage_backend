const express = require('express');
const PaymentHistoryController = require('../controllers/paymenthistory.controller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// User payment routes
router.get('/history', PaymentHistoryController.getPaymentHistory);
router.get('/stats', PaymentHistoryController.getPaymentStats);
router.get('/:id', PaymentHistoryController.getPaymentById);
router.post('/', PaymentHistoryController.createPayment);
router.put('/:id/status', PaymentHistoryController.updatePaymentStatus);

// Admin routes (require admin privileges)
router.get('/admin/all', adminMiddleware, PaymentHistoryController.getAllPayments);
router.get('/admin/recent', adminMiddleware, PaymentHistoryController.getRecentPayments);
router.get('/admin/stats', adminMiddleware, PaymentHistoryController.getAdminPaymentStats);

module.exports = router;
