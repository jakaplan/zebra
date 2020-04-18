const argv = require('yargs').argv;
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const app = express()
const port = 5000

console.log("Zebra API server initializing...\n");

if(!argv.key) {
    console.log("Stripe API key is required to run this server");
    console.log("To specify, when running: --key=<key_here>");
    // Quit with invalid process exit code
    process.exit(9);
}

if(!argv.endpoint_secret) {
    console.log("No endpoint secret specified, skipping webhook signature check");
    console.log("To specifiy, when running: --endpoint_secret=<secret>");
}

// Create logs directory if it doesn't exist yet
if(!fs.existsSync('./logs')) {
    fs.mkdirSync('./logs');
    console.log("Created logs directory");
}

// Open transaction log stream, by default stream will close when process terminates
const logStream = fs.createWriteStream('./logs/transactions.txt', {flags: 'a'});

// Set your secret key. Remember to switch to your live secret key in production!
// See your keys here: https://dashboard.stripe.com/account/apikeys
// Key = sk_test_KdE2iNsDxi481yEX9aO4KkQr00aSeeoINj
const stripe = require('stripe')(argv.key);

app.get('/', (req, res) => res.send('What\'re you looking at this? This is an API server!'))
app.listen(port, () => console.log(`\nServer running at http://localhost:${port}`))

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
    if(argv.endpoint_secret) {
        console.log("checking webhook signature");
        const sig = req.headers['stripe-signature'];
        try {
            event = stripe.webhooks.constructEvent(req.body, sig, argv.endpoint_secret);
        }
        catch (err) {
            console.log("webhook error");
            res.status(400).send(`Webhook Error: ${err.message}`);
        }
    } else {
        try {
            event = JSON.parse(request.body);
          } catch (err) {
            response.status(400).send(`Webhook Error: ${err.message}`);
          }
    }


    
    console.log("Event type: " + event.type);

    
    logStream.write("Incoming webhook, event type is: " + event.type + '\n');

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