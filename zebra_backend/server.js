const argv = require('yargs').argv;
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 5000;

// Deal of the day (values hardcoded for demo)
const dotdName = 'Candy Cane';
const dotdDescription = 'Peppermint flavored Christmas treat with white and red stripes';
const dotdImageURL = 'https://upload.wikimedia.org/wikipedia/commons/d/de/Candy-Cane-Classic.jpg';
const dotdPrice = 249;
const dotdCurrency = 'usd';

// Initialization
printServerStartupMessage();
checkCommandLineArgs();
app.listen(port, () => console.log(`API server now running at http://localhost:${port}`))
const stripe = require('stripe')(argv.key);
const transactionLog = initializeTransactionLog();

// GET endpoint to retrieve the deal of the day
app.get('/api/dotd', function(req, res) {
    res.json({name: dotdName,
              description: dotdDescription,
              image_url: dotdImageURL,
              price: dotdPrice,
              currency: dotdCurrency});
});

// GET endpoint called by web client to retrieve Stripe client secret
app.get('/api/secret', async(req, res) => {
    const intent = await stripe.paymentIntents.create({
        amount: dotdPrice,
        currency: dotdCurrency,
        
        // Verify your integration in this guide by including this parameter
        //metadata: {integration_check: 'accept_a_payment'},
      });
    res.json({client_secret: intent.client_secret});
});

// POST endpoint for webhook called by Stripe servers
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

    
    transactionLog.write("Incoming webhook, event type is: " + event.type + '\n');

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

function printServerStartupMessage() {
    let zebra = "                                       \n\
                                888                     \n\
                                888                     \n\
                                888                     \n\
                88888888 .d88b. 88888b. 888d888 8888b.  \n\
                   d88P d8P  Y8b888 \"88b888P\"      \"88b \n\
                  d88P  88888888888  888888    .d888888 \n\
                 d88P   Y8b.    888 d88P888    888  888 \n\
                88888888 \"Y8888 88888P\" 888    \"Y888888 \n\n";
            
    console.log(zebra);
    console.log("                            Initializing...\n");
}

function checkCommandLineArgs() {
    // Check for mandatory Stripe API key
    // When running in production this should be the live secret
    if(!argv.key) {
        console.log("🛑 Stripe API key is required to run this server");
        console.log("API keys can be seen at https://dashboard.stripe.com/account/apikeys");
        console.log("To specify, when running: --key=<key_here>");

        // Quit with invalid process exit code
        process.exit(9);
    }
    
    // Check for optional endpoint secret
    if(!argv.endpoint_secret) {
        console.log("⚠️  No endpoint secret specified, skipping webhook signature check");
        console.log("To specifiy, when running: --endpoint_secret=<secret>");
    }
}

function initializeTransactionLog() {
    // Create logs directory if it doesn't exist yet
    if(!fs.existsSync('./logs')) {
        fs.mkdirSync('./logs');
        console.log("Created logs directory");
    }

    // Open transaction log stream, by default stream will close when process terminates
    logStream = fs.createWriteStream('./logs/transactions.txt', {flags: 'a'});

    return logStream;
}

function recordTransaction() {
    //TODO
}
