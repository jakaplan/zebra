import React, { Component } from 'react';
import './DealOfTheDay.css';

/**
 * Information returned by the server describing the deal of the day
 */
interface DealOfTheDayState {
    name: string;
    description: string;
    image_url: string; 
    price: number;
    currency: string;
}

class DealOfTheDay extends Component<{}, DealOfTheDayState> {

    render() {
        // If state data has been fetched from server, render it
        if(this.state) {
            let priceStr: string = "$" + this.state.price / 100;

            return (
                <div className="DealOfTheDay">
                    <img className="DealImage" src={this.state.image_url} alt={this.state.description} />
                    <div className="DealOfTheDay-name">{this.state.name}</div>
                    <div className="DealOfTheDay-price">{priceStr}</div>
                </div>
            );
        }
        // Otherwise show the user it's loading
        else {
            return (
                <div className="DealOfTheDay-message">
                  Loading your deal of the day...
                </div>
            );
        }
    }

    componentDidMount() {
        this.fetchDealOfTheDay();
    }

    /**
     * Async fetches information from the server about the deal
     * of the day and sets this component's state to it
     */
    async fetchDealOfTheDay() {
        let response = await fetch('/api/dotd');
        if(response.status === 200) {
            this.setState(await response.json());
        }
    }
}

export default DealOfTheDay;