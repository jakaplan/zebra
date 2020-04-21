import fs, {WriteStream} from "fs";
import express, {Request, Response} from "express";
import bodyParser from "body-parser";
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
checkEnvironmentVariables();
app.listen(port, () => console.log(`\nAPI server now running at http://localhost:${port}`))
const stripe = require('stripe')(process.env.STRIPE_API_KEY);
const transactionLog = initializeTransactionLog();

// Holds information about a transaction prior while it's in flight until recorded
// to the transaction log. Gets purged periodically of transactions that never
// completed in order to prevent a memory leak.
const transactionCache = new Map();

// Every minute check for all transactions records that have been pending for more than 30 minutes
setInterval(removeOldTransactionCacheEntries, 60000);
function removeOldTransactionCacheEntries() {
    let now = Date.now();
    transactionCache.forEach(function(id: string, transactionRecord) {
        // If it's been over 30 minutes, remove the transaction record
        if (transactionRecord.date + (30 * 60 * 1000) < now) {
            transactionCache.delete(id);
        }
    })
}

// GET endpoint to retrieve the deal of the day
app.get('/api/dotd', function(req: Request, res: Response) {
    res.json({name: dotdName,
              description: dotdDescription,
              image_url: dotdImageURL,
              price: dotdPrice,
              currency: dotdCurrency});
});

// POST endpoint called by client to provide payment info excluding credit card info
// and get returned Stripe client secret
app.post('/api/begin_payment', bodyParser.raw({type: 'application/json'}), async(req: Request, res: Response) => {
    let paymentInfo = JSON.parse(req.body);

    let name = paymentInfo['name'];
    let email = paymentInfo['email'];
    let address = paymentInfo['address'];
    let city = paymentInfo['city'];
    let state = paymentInfo['state'];

    console.log(name + " :: " + email + " :: " + address + " :: " + city + " :: " + state);

    // Return client secret
    const intent = await stripe.paymentIntents.create({
        amount: dotdPrice,
        currency: dotdCurrency,
    });

    console.log("intent created, client_secret: " + intent.client_secret);
    console.log("intent created, id: " + intent.id);

    // Record in transaction cache
    transactionCache.set(intent.id,{date: Date.now(),
                                    product: dotdName,
                                    price: dotdPrice,
                                    name: name,
                                    email: email,
                                    address: address,
                                    city: city,
                                    state: state});

    res.json({client_secret: intent.client_secret});
})

// POST endpoint for webhook called by Stripe servers (in development called via Stripe CLI)
app.post('/hooks', bodyParser.raw({type: 'application/json'}), (req: Request, res: Response) => {
    let event;
    if(process.env.STRIPE_ENDPOINT_SECRET) {
        const sig = req.headers['stripe-signature'];
        try {
            event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_ENDPOINT_SECRET);
        }
        catch (err) {
            res.status(400).send(`Webhook Error: ${err.message}`);
        }
    } else {
        try {
            event = JSON.parse(req.body);
          } catch (err) {
            res.status(400).send(`Webhook Error: ${err.message}`);
          }
    }

    // If a successful payment occurred, record it in the transaction log
    if(event.type === 'payment_intent.succeeded') {
        const id = event.data.object.id;
        recordTransaction(id, transactionCache.get(id));
        transactionCache.delete(id);

        console.log("Transaction succesfully completed, id: " + id);
    }

    // Return a response to acknowledge receipt of the event
    res.json({received: true});
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

function checkEnvironmentVariables() {
    // Check for mandatory Stripe API key
    // When running in production this should be the live secret
    if(!process.env.STRIPE_API_KEY) {
        console.log("🛑 Stripe API key is required to run this server");
        console.log("API keys can be seen at https://dashboard.stripe.com/account/apikeys");
        console.log("To specify, before running: export STRIPE_API_KEY=<key_here>");

        // Quit with invalid process exit code
        process.exit(9);
    }
    
    // Check for optional endpoint secret
    if(!process.env.STRIPE_ENDPOINT_SECRET) {
        console.log("⚠️  No endpoint secret specified, webhook signature check will be skipped");
        console.log("To specifiy, before running: export STRIPE_ENDPOINT_SECRET=<secret>");
    }
}

function initializeTransactionLog(): WriteStream {
    // Create logs directory if it doesn't exist yet
    if(!fs.existsSync('./logs')) {
        fs.mkdirSync('./logs');
        console.log("Created logs directory");
    }

    // Determine if transaction log exists yet, if not when we create it we'll write
    // column headers
    let transactionLogExists = fs.existsSync('./logs/transactions.csv');

    // Open transaction log stream, by default stream will close when process terminates
    let logStream = fs.createWriteStream('./logs/transactions.csv', {flags: 'a'});

    // Write CSV header row
    if(!transactionLogExists) {
        logStream.write("id, date, product, price, name, email, address, city, state\n");
    }

    return logStream;
}

function recordTransaction(id: string, transactionRecord: any) {
    let csvSafe = (str: String) => { return str.replace(/"/g, '""').replace(/,/g, '","')};

    transactionLog.write(csvSafe(id) + ',' +
                         transactionRecord.date + ',' +
                         csvSafe(transactionRecord.product) + ',' +
                         transactionRecord.price + ',' +
                         csvSafe(transactionRecord.name) + ',' +
                         csvSafe(transactionRecord.email) + ',' +
                         csvSafe(transactionRecord.address) + ',' +
                         csvSafe(transactionRecord.city) + ',' +
                         csvSafe(transactionRecord.state) + '\n');
}