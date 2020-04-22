import React, { Component } from 'react';
import './DealOfTheDay.css';

interface DealOfTheDayProps {
    name: string;
    description: string;
    imageUrl: string;
}

class DealOfTheDay extends Component<DealOfTheDayProps> {

    render() {
        return (
            <div className="DealOfTheDay">
                <img className="DealImage" src={this.props.imageUrl} alt={this.props.description} />
                <div className="DealOfTheDay-name">{this.props.name}</div>
            </div>
        );
    }

}

export default DealOfTheDay;