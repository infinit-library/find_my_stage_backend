const express = require('express');
const router = express.Router();
const stripeController = require('../controllers/stripe.controller');

router.post('/create-payment-intent', stripeController.createPaymentIntent);
router.post('/create-checkout-session', stripeController.createCheckoutSession);

module.exports = router;