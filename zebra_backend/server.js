const argv = require('yargs').argv;
const express = require('express');
const bodyParser = require('body-parser');
const app = express()
const port = 5000

if(!argv.key) {
    console.log('Please specify a Stripe API key when running: --key=<key_here>');

    // Quit with invalid process exit code
    process.exit(9);
}

// Set your secret key. Remember to switch to your live secret key in production!
// See your keys here: https://dashboard.stripe.com/account/apikeys
// Key = sk_test_KdE2iNsDxi481yEX9aO4KkQr00aSeeoINj
const stripe = require('stripe')(argv.key);

app.get('/', (req, res) => res.send('What\'re you looking at this? This is an API server!'))

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))

app.get('/api/secret', async(req, res) => {
    const intent = await stripe.paymentIntents.create({
        amount: 1099,
        currency: 'usd',
        // Verify your integration in this guide by including this parameter
        metadata: {integration_check: 'accept_a_payment'},
      });
    res.json({client_secret: intent.client_secret});
});

app.post('/hooks', bodyParser.raw({type: 'application/json'}), (req, res) => {
    console.log("webhook received");
    
    let event;

    try {
        event = JSON.parse(req.body);
    } catch (err) {
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    console.log("Event type: " + event.type);

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        // Then define and call a method to handle the successful payment intent.
        // handlePaymentIntentSucceeded(paymentIntent);
        break;
        case 'payment_method.attached':
        const paymentMethod = event.data.object;
        // Then define and call a method to handle the successful attachment of a PaymentMethod.
        // handlePaymentMethodAttached(paymentMethod);
        break;
        // ... handle other event types
        default:
        // Unexpected event type
        return res.status(400).end();
    }

    // Return a response to acknowledge receipt of the event
    res.json({received: true});

    //console.log(req);
    //res.status(200).end()
})