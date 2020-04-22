import React from 'react';
import ReactDOM from 'react-dom';
import {Elements} from '@stripe/react-stripe-js';
import {loadStripe} from '@stripe/stripe-js';
import './index.css';
import App from './App';

// Read the publishable key set as an environment variable
let publishableKey = process.env.REACT_APP_PUBLISHABLE_KEY;
if(publishableKey) {
  const stripePromise = loadStripe(publishableKey);

  ReactDOM.render(
    <React.StrictMode>
      <Elements stripe={stripePromise}>
        <App />
      </Elements>
    </React.StrictMode>,
    document.getElementById('root')
  );
}
else {
  ReactDOM.render(
    <React.StrictMode>
      <div>Set publishable key; in your terminal type: export REACT_APP_PUBLISHABLE_KEY=&lt;publishable_key&gt;</div>
    </React.StrictMode>,
    document.getElementById('root')
  );
}