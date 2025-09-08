const express = require('express');
const router = express.Router();

// Stripe webhook endpoint
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      console.error('Stripe webhook secret not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    // In a real application, you would verify the webhook signature
    // const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

    // For now, just log the webhook
    console.log('Stripe webhook received:', req.body);

    res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
});

// Generic webhook endpoint
router.post('/generic', async (req, res) => {
  try {
    console.log('Generic webhook received:', req.body);
    res.json({ received: true });
  } catch (error) {
    console.error('Generic webhook error:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
});

module.exports = router;
