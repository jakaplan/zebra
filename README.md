# zebra

Written project for Stripe PM interview.

This implementation is a faux e-commerce site offering a daily deal for a striped item. Think [woot!](https://en.wikipedia.org/wiki/Woot), but way more esoteric.

## Getting started
To try this out you'll need to have three pieces up and running:
 - Web server (`zebra_frontend`) which hosts the web client for the e-commerce site
 - API server (`zebra_backend`) which the web client talks to to find out about the deal of the day and processes payments
 - [Stripe CLI](https://stripe.com/docs/stripe-cli) which locally sends Stripe webhook calls to the API server

To run this locally:
 1. If you don't already have one, create a [Stripe developer account](https://dashboard.stripe.com/register)
 2. After verifying your account, note down your test publishable and secret keys from your [dashboard](https://dashboard.stripe.com/test/apikeys)
 3. Checkout this git repo
 4. If you don't have it installed, install [npm](https://www.npmjs.com/get-npm)
 5. Install [Stripe CLI](https://stripe.com/docs/stripe-cli) and link your account
 6. Start Stripe CLI with: `stripe listen --forward-to localhost:5000/hooks`
    - Note: API server (`zebra_backend`) runs on port 5000 and listens for Stripe webhooks at `/hooks`
 7. Optionally note down the webhook signing secret the Stripe CLI outputs
    - If you don't provide the API server with the signing secret it'll still function, but won't verify validatity of web hook calls it receives
 8. Open a terminal and set `STRIPE_API_KEY` environment variable to the secret key value you got in step 2
    - The specifics of this may vary by operating system, on macOS you can do this with: `export STRIPE_API_KEY=<key_value>`
 9. Optionally set `STRIPE_ENDPOINT_SECRET` environment variable to the secret key value you got in step 7
 10. Install the dependencies for the API server by navigating to the `zebra_backend` folder, and typing `npm install`
 11. Once that's completed, start the API server by typing `npm run start`
 11. In a new terminal window set `REACT_APP_PUBLISHABLE_KEY` to the publishable key you got in step 2
 12. Install the dependencies for the web server by navigating to the `zebra_frontend` folder and typing `npm install`
 13. Once that's completed, start the web server by typing `npm run start`
     - Your browser should automatically open up the web client, but if it doesn't navigate to http://localhost:3000
     
     
## Validating
Beyond seeing error states or a succesful purchase in the web client, you can confirm a successful order has been received by the server by checking the transaction log. The transaction log is a CSV file that is located at `\zebra\zebra-backend\logs\transactions.csv`.

### A note on CSVs
CSV isn't exactly a consistent standard, particularly when it comes to escaping double quote marks and commas. The CSV encoding used here escapes commas by putting them inside of a pair of quotation marks and escape quotation marks by prefixing them with another quotation mark. Many CSV parsers such as [macOS's Quick Look](https://support.apple.com/guide/mac-help/view-and-edit-files-with-quick-look-mh14119/mac) use this format, but not all may (at least by default).
