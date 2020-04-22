import React, { Component, MouseEvent } from 'react';
import './App.css';
import CheckoutForm from './CheckoutForm';
import DealOfTheDay from './DealOfTheDay';

interface AppState {
    showCheckoutForm: boolean;
    dealOfTheDayInfoFetched: boolean;
    name: string;
    description: string;
    imageUrl: string; 
    price: number;
    currency: string;
}

/**
 * Information returned by the server describing the deal of the day
 */
interface DealOfTheDayInfo {
  name: string;
  description: string;
  image_url: string; 
  price: number;
  currency: string;
}

class App extends Component<{}, AppState> {
    constructor(props: {}) {
        super(props);

        this.state = {showCheckoutForm: false,
                      dealOfTheDayInfoFetched: false,
                      name: '',
                      description: '',
                      imageUrl: '', 
                      price: 0,
                      currency: ''};
        this.handleButtonClick = this.handleButtonClick.bind(this);
    }

    render() {
        if(this.state.dealOfTheDayInfoFetched) {
        let buyNow: string = "Buy now for $" + this.state.price / 100;  

          return (
            <div className="App">
                <header className="App-header">
                    <h2>Your Striped Deal of the Day</h2>
                    <DealOfTheDay name={this.state.name}
                                  description={this.state.description}
                                  imageUrl={this.state.imageUrl}
                                  price={this.state.price}/>
                    {this.state.showCheckoutForm ?
                        <CheckoutForm/> :
                        <button className="App-button" onClick={this.handleButtonClick}>{buyNow}</button>}
                </header>
            </div>
          );
        }
        else
        {
          return (
            <div className="App">
                <header className="App-header">
                    <h2>Your Striped Deal of the Day</h2>
                    <div className="App-loading">Loading...</div>
                </header>
            </div>
          );
        }

    }

    handleButtonClick(event: MouseEvent) {
        event.preventDefault();
        this.setState({showCheckoutForm: true});
    }

    componentDidMount() {
        this.fetchDealOfTheDayInfo();
    }

    /**
     * Async fetches information from the server about the deal
     * of the day and sets this component's state to it
     */
    async fetchDealOfTheDayInfo() {
        let response = await fetch('/api/dotd');
        if(response.status === 200) {
            let data: DealOfTheDayInfo = await response.json();
            this.setState({
                dealOfTheDayInfoFetched: true,
                name: data.name,
                description: data.description,
                imageUrl: data.image_url,
                price: data.price,
                currency: data.currency
            });
        }
    }
}

export default App;