const axios = require('axios');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createPaymentIntent = async (req, res) => {
    try {
        console.log("req.body", req.body);
      const { amount, currency } = req.body;
  
      if (!amount || !currency) {
        return res.status(400).json({ error: "Amount and currency are required" });
      }
  
      const paymentIntent = await stripe.paymentIntents.create({
        amount, // in cents
        currency,
        automatic_payment_methods: { enabled: true },
      });
  
      res.status(200).json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (err) {
      console.error("Stripe Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  };

const createCheckoutSession = async (req, res) => {
    try {
        console.log("Stripe checkout request body:", req.body);
        const { email, topic, industry } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        // Build success URL with search parameters
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
        const searchParams = new URLSearchParams();
        if (topic) searchParams.set('topic', topic);
        if (industry) searchParams.set('industry', industry);
        searchParams.set('payment', 'success');
        
        const successUrl = `${baseUrl}/results?${searchParams.toString()}`;

        console.log("Creating Stripe checkout session with success URL:", successUrl);
        
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Find My Stage Subscription',
                            description: 'Full access to 100+ additional opportunities',
                        },
                        unit_amount: 9700, // $97.00 in cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            customer_email: email,
            success_url: successUrl,
            cancel_url: `${baseUrl}/subscribe-cancel`,
        });

        console.log("Stripe session created:", { id: session.id, url: session.url });

        res.status(200).json({
            url: session.url,
            id: session.id
        });
    } catch (err) {
        console.error("Stripe Checkout Error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
  createPaymentIntent,
  createCheckoutSession
};
  