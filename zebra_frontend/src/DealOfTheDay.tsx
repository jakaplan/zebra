import React, { Component } from 'react';
import './DealOfTheDay.css';

interface DealOfTheDayProps {
    name: string;
    description: string;
    imageUrl: string; 
    price: number;
}

class DealOfTheDay extends Component<DealOfTheDayProps> {

    render() {
        let priceStr: string = "$" + this.props.price / 100;

        return (
            <div className="DealOfTheDay">
                <img className="DealImage" src={this.props.imageUrl} alt={this.props.description} />
                <div className="DealOfTheDay-name">{this.props.name}</div>
            </div>
        );
    }

}

export default DealOfTheDay;