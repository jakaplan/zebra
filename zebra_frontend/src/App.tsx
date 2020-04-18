import React from 'react';
import logo from './logo.svg';
import './App.css';
import CheckoutForm from './CheckoutForm';

interface NotSecret {
  hello: string;
}

interface Secret {
  client_secret: string;
}

/*
function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}
*/

class App extends React.Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.tsx</code> and save to load
          </p>

          <CheckoutForm/>

          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
    );
  }

  componentDidMount() {
    this.fetchSecret();
  }

  fetchNotSecret() {
    //let app = this;

    fetch('/api/not_secret')
    .then(
      function(response: Response) {
        if (response.status === 200) {  
          console.log("Talked to server");
          console.log(response);

          response.json().then(function(data: NotSecret) {
            console.log("Parsed JSON");
            console.log("Raw Data:" + data);
            console.log("Hello field: " + data.hello);
          });
        }
        /*
        console.log("Successfully talked to the server");

        response.json().then(function(data: {}) {
          console.log("Parsed JSON");
        });
        */
      }
    )
    .catch()
  }

  fetchSecret() {
    fetch('/api/secret')
    .then(
      function(response: Response) {
        if (response.status === 200) {  
          console.log("Talked to server");
          console.log(response);

          response.json().then(function(data: Secret) {
            console.log(data.client_secret);
            // Call stripe.confirmCardPayment() with the client secret.
          });
        }
      }
    )
    .catch()
  }
}

export default App;
