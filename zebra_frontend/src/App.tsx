import React, { Component, MouseEvent } from 'react';
import './App.css';
import CheckoutForm from './CheckoutForm';
import DealOfTheDay from './DealOfTheDay';

interface AppState {
    showCheckoutForm: boolean;
}

class App extends Component<{}, AppState> {
    constructor(props: {}) {
        super(props);

        this.state = {showCheckoutForm: false};
        this.handleButtonClick = this.handleButtonClick.bind(this);
    }

    render() {
        return (
            <div className="App">
                <header className="App-header">
                    <h2>Your Striped Deal of the Day</h2>
                    <DealOfTheDay/>
                    {this.state.showCheckoutForm ?
                        <CheckoutForm/> :
                        <button className="App-button" onClick={this.handleButtonClick}>Buy now</button>}
                </header>
            </div>
          );
    }

  handleButtonClick(event: MouseEvent) {
      event.preventDefault();
      this.setState({showCheckoutForm: true});
  }
}

export default App;