const express = require('express')
const app = express()
const port = 5000

// Set your secret key. Remember to switch to your live secret key in production!
// See your keys here: https://dashboard.stripe.com/account/apikeys
const stripe = require('stripe')('sk_test_KdE2iNsDxi481yEX9aO4KkQr00aSeeoINj');

app.get('/', (req, res) => res.send('Hello World!'))

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

app.get('/api/not_secret', async(req, res) => {
    res.json({hello: 'world'});
});