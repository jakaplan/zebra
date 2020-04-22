# zebra

A faux e-commerce site using Stripe's payment APIs to offer a daily deal for a striped item (e.g. candy canes). Think [woot!](https://en.wikipedia.org/wiki/Woot), but way more esoteric.

This codebase consists of two parts:
 - `zebra_frontend` which is a React web client written in TypeScript/TSX and CSS
 - `zebra_backend` which is a Node server acting as the API backend for the web client written in TypeScript

## Running locally
To try this out you'll need to have three pieces up and running:
 - Web server (`zebra_frontend`)
 - API server (`zebra_backend`)
 - [Stripe CLI](https://stripe.com/docs/stripe-cli) which locally sends Stripe webhook calls to the API server

### First run instructions
 1. If you don't already have one, create a [Stripe developer account](https://dashboard.stripe.com/register)
 2. After verifying your account, note down your test publishable and secret keys from your [dashboard](https://dashboard.stripe.com/test/apikeys)
 3. Clone this repo: `git clone https://github.com/jakaplan/zebra.git`
 4. If you don't have it installed, install [npm](https://www.npmjs.com/get-npm)
 5. Install [Stripe CLI](https://stripe.com/docs/stripe-cli) and link your account
 6. Start Stripe CLI with: `stripe listen --forward-to localhost:5000/hooks`
    - Note: API server (`zebra_backend`) runs on port 5000 and listens for Stripe webhooks at `/hooks`
 7. Optionally note down the webhook signing secret the Stripe CLI outputs
    - If you don't provide the API server with the signing secret it'll still function, but won't verify validatity of web hook calls it receives
 8. Open a terminal and set `STRIPE_API_KEY` environment variable to the secret key value you got in step 2
    - The specifics of this may vary by operating system, on macOS you can do this with: `export STRIPE_API_KEY=<key_value>`
 9. Optionally set `STRIPE_ENDPOINT_SECRET` environment variable to the secret key value you got in step 7
 10. Install the dependencies for the API server by navigating to the `zebra_backend` directory and typing `npm install`
 11. Once that's completed, start the API server by typing `npm run start`
 11. In a new terminal window set `REACT_APP_PUBLISHABLE_KEY` to the publishable key you got in step 2
 12. Install the dependencies for the web server by navigating to the `zebra_frontend` directory and typing `npm install`
 13. Once that's completed, start the web server by typing `npm run start`
     - Your browser should automatically open up the web client, but if it doesn't then navigate to http://localhost:3000

If you make any changes to the frontend or backend, a best attempt will be made to automatically restart either server with the changes. However, some types of errors may cause the restart to fail and stop retrying. If that happens restart either of them with `npm run start` and you'll be back in business.

### Subsequent run instructions
If you close your terminal session (including restarting your computer), you'll need to set the environment variables again. On macOS you can check your environment variables by typing `printenv` in a terminal; instructions may vary across operating systems. As a reminder the environment variables used by `zebra` are:
 - `STRIPE_API_KEY` - _required_ secret key accessed at https://dashboard.stripe.com/test/apikeys
 - `STRIPE_ENDPOINT_SECRET` - _optional_ output by Stripe CLI after it starts
 - `REACT_APP_PUBLISHABLE_KEY` - _required_ publishable key accessed at https://dashboard.stripe.com/test/apikeys
 
 For subsequent runs:
 1. Start Stripe CLI with: `stripe listen --forward-to localhost:5000/hooks`
 2. In a new terminal, if needed set `STRIPE_API_KEY` environment variable and then in the `zebra_backend` directory type `npm run start`
    - Optionally set `STRIPE_ENDPOINT_SECRET` environment variable in this terminal before tryping `npm run start`
 3. In a new terminal, if needed set `REACT_APP_PUBLISHABLE_KEY` environment variable and then in the `zebra_frontend` directory type `npm run start`
     
## Validating
Beyond seeing error states or a succesful purchase in the web client, you can confirm a successful order has been received by the server by checking the transaction log. The transaction log is a CSV file that is located at `/zebra/zebra-backend/logs/transactions.csv`.

### A note on CSVs
CSV isn't exactly a consistent standard, particularly when it comes to escaping double quote marks and commas. The CSV encoding used here escapes commas by putting them inside of a pair of quotation marks and escape quotation marks by prefixing them with another quotation mark. Many CSV parsers such as [macOS's Quick Look](https://support.apple.com/guide/mac-help/view-and-edit-files-with-quick-look-mh14119/mac) use this format, but not all may (at least by default).
