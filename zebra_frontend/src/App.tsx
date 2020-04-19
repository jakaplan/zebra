import React from 'react';
import './App.css';
import CheckoutForm from './CheckoutForm';
import DealOfTheDay from './DealOfTheDay';

class App extends React.Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          Daily Deal!
          <DealOfTheDay/>
          <CheckoutForm/>
        </header>
      </div>
    );
  }
}

export default App;