import Stripe from "stripe";
import fs, {WriteStream} from "fs";
import express, {Request, Response} from "express";
import bodyParser from "body-parser";

/**
 * Record of information about a transaction which will be record upon a succesful payment
 */
interface TransactionRecord {
    id: string;
    date: number;
    product: string;
    price: number;
    name: string;
    email: string;
    address: string;
    city: string;
    state: string;
}

/**
 * Environment variables
 */
interface EnvironmentVariables {
    stripeAPIKey: string;
    stripeEndpointSecurity: string | undefined;
}

// Deal of the day (values hardcoded for this example)
const dotdName = 'Candy Cane';
const dotdDescription = 'Peppermint flavored Christmas treat with white and red stripes';
const dotdImageURL = 'https://upload.wikimedia.org/wikipedia/commons/d/de/Candy-Cane-Classic.jpg';
const dotdPrice = 249;
const dotdCurrency = 'usd';

// Initialization
const app = express();
const port = 5000;
printServerStartupMessage();
const envVars = checkEnvironmentVariables();
app.listen(port, () => console.log(`\nAPI server now running at http://localhost:${port}`))

const stripe = new Stripe(envVars.stripeAPIKey, {apiVersion: '2020-03-02', typescript: true});

//const stripe = require('stripe')(process.env.STRIPE_API_KEY);
const transactionLog = initializeTransactionLog();

// Holds information about a transaction prior while it's in flight until recorded
// to the transaction log. Gets purged periodically of transactions that never
// completed in order to prevent a memory leak.
const transactionCache = new Map<string, TransactionRecord>();

// Every minute check for all transactions records that have been pending for more than 30 minutes
setInterval(removeOldTransactionCacheEntries, 60000);
function removeOldTransactionCacheEntries() {
    let now = Date.now();
    transactionCache.forEach(function(record: TransactionRecord, id: string) {
        // If it's been over 30 minutes, remove the transaction record
        if (record.date + (30 * 60 * 1000) < now) {
            transactionCache.delete(id);
        }
    })
}

/**
 * GET endpoint to retrieve the deal of the day
 */
app.get('/api/dotd', function(_, res: Response) {
    res.json({name: dotdName,
              description: dotdDescription,
              image_url: dotdImageURL,
              price: dotdPrice,
              currency: dotdCurrency});
});

/**
 * POST endpoint called by client to provide payment info excluding credit card info
 * Returns Stripe client secret needed to proceed with client side flow
 */
app.post('/api/begin_payment', bodyParser.raw({type: 'application/json'}), async(req: Request, res: Response) => {
    // Fetch intent which contains client secret and identifier
    const intent = await stripe.paymentIntents.create({
        amount: dotdPrice,
        currency: dotdCurrency,
    });

    console.log("➡️  Client has begun payment flow, id: " + intent.id);

    // Record in transaction cache
    let paymentInfo = JSON.parse(req.body);
    transactionCache.set(intent.id, {id: intent.id,
                                     date: Date.now(),
                                     product: dotdName,
                                     price: dotdPrice,
                                     name: paymentInfo['name'],
                                     email: paymentInfo['email'],
                                     address: paymentInfo['address'],
                                     city: paymentInfo['city'],
                                     state: paymentInfo['state']});

    // Return the client secret needed for the client side payment flow
    res.json({client_secret: intent.client_secret});
})

/**
 * POST endpoint for webhook called by Stripe servers (in development called via Stripe CLI)
 */
app.post('/hooks', bodyParser.raw({type: 'application/json'}), (req: Request, res: Response) => {
    // Parse the event and optionally validate its origin
    let event: Stripe.Event;
    if(envVars.stripeEndpointSecurity) {
        try {
            const sig = req.headers['stripe-signature'];
            if(sig) {
                event = stripe.webhooks.constructEvent(req.body, sig, envVars.stripeEndpointSecurity);
            } else {
                res.status(400).send('Webhook Error: stripe-signature missing');
                return;
            }
        }
        catch(err) {
            res.status(400).send(`Webhook Error: ${err.message}`);
            return;
        }
    }
    else {
        try {
            event = JSON.parse(req.body);
        }
        catch (err) {
            res.status(400).send(`Webhook Error: ${err.message}`);
            return;
        }
    }

    // If a successful payment occurred, record it in the transaction log
    if(event.type === 'payment_intent.succeeded') {
        //const id = event.data.object.id;

        // In the case of a payment intent, the data object will contain an ID which
        // matches the id used when creating the payment intent
        const obj: any = event.data.object;
        const id: string = obj.id;

        let record: TransactionRecord | undefined = transactionCache.get(id);
        if(record) {
            recordTransaction(record);
            transactionCache.delete(id);
            console.log("💰 Transaction succesfully completed, id: " + id);
        }
        else {
            console.log("🔥 Unexpected transaction received, id: " + id);
        }
    }

    // Acknowledge hook was received
    res.json({received: true});
})

/**
 * Prints fun text that appears in terminal at beginning of server start
 */
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

/**
 * Checks that the mandatory and optional values are set as environment variables
 * If a mandatory environment variable isn't set the server process will exit
 */
function checkEnvironmentVariables(): EnvironmentVariables {
    // Check for mandatory Stripe API key
    // When running in production this should be the live secret
    let apiKey = '';
    if(!process.env.STRIPE_API_KEY) {
        console.log("🛑 Stripe API key is required to run this server");
        console.log("API keys can be seen at https://dashboard.stripe.com/account/apikeys");
        console.log("To specify, before running: export STRIPE_API_KEY=<key_here>");

        // Quit with invalid process exit code
        process.exit(9);
    }
    else {
        apiKey = process.env.STRIPE_API_KEY;
    }
    
    // Check for optional endpoint secret
    if(!process.env.STRIPE_ENDPOINT_SECRET) {
        console.log("⚠️  No endpoint secret specified, webhook signature check will be skipped");
        console.log("To specifiy, before running: export STRIPE_ENDPOINT_SECRET=<secret>");
    }

    return {stripeAPIKey: apiKey,
            stripeEndpointSecurity: process.env.STRIPE_ENDPOINT_SECRET};
}

/**
 * Creates and returns the transaction log. If it does not exist, the log folder will be created
 * and the header row will be written to the log.
 * 
 * @returns stream for the transaction log
 */
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

/**
 * Writes a row to the transaction log CSV. Inputs will be sanitized to be CSV safe before
 * writing them to the log.
 * 
 * @param transactionRecord information about the transaction
 */
function recordTransaction(transactionRecord: TransactionRecord) {
    let csvSafe = (str: String) => { return str.replace(/"/g, '""').replace(/,/g, '","')};

    transactionLog.write(csvSafe(transactionRecord.id) + ',' +
                         transactionRecord.date + ',' +
                         csvSafe(transactionRecord.product) + ',' +
                         transactionRecord.price + ',' +
                         csvSafe(transactionRecord.name) + ',' +
                         csvSafe(transactionRecord.email) + ',' +
                         csvSafe(transactionRecord.address) + ',' +
                         csvSafe(transactionRecord.city) + ',' +
                         csvSafe(transactionRecord.state) + '\n');
}