import React, { Component } from 'react';
import './App.css';
import BuyNowButton from './BuyNowButton';
import CheckoutForm from './CheckoutForm';
import DealOfTheDay from './DealOfTheDay';

interface AppState {
  showCheckoutForm: boolean;
}

class App extends Component<{}, AppState> {
  constructor(props: {}) {
    super(props);

    this.state = {showCheckoutForm: false};
    this.showCheckoutForm = this.showCheckoutForm.bind(this);
  }

  render() {
    if(this.state.showCheckoutForm) {
      return (
        <div className="App">
          <header className="App-header">
            Daily Deal!
            <DealOfTheDay/>
            <CheckoutForm/>
          </header>
        </div>
      );
    } else {
      return (
        <div className="App">
          <header className="App-header">
            Daily Deal!
            <DealOfTheDay/>
            <BuyNowButton showCheckoutForm={this.showCheckoutForm}/>
          </header>
        </div>
      );
    }
  }

  showCheckoutForm() {
    this.setState({showCheckoutForm: true});
  }
}

export default App;