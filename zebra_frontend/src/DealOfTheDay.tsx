import React, { Component } from 'react';

interface DealOfTheDay {
    name: string;
    description: string;
    image_url: string; 
    price: number;
    currency: string;
}

class DealOfTheDay extends Component<{}, DealOfTheDay> {

    render() {
        if(this.state) {
            let priceStr: string = "$" + this.state.price / 100;

            return (
                <div className="DealOfTheDay">
                    <img className="DealImage"
                        src={this.state.image_url}
                        alt={this.state.description}
                        style={{width:200, height:200}} //TODO - move to CSS
                    />
                    <p>{this.state.name}</p>
                    <h6>{priceStr}</h6>
                </div>
            );
        } else{
            return (
                <div className="DealOfTheDay">
                  Loading your deal of the day...
                </div>
            );
        }
    }

    componentDidMount() {
        this.fetchDealOfTheDay();
    }

    fetchDealOfTheDay() {
        let app = this;

        fetch('/api/dotd')  
        .then(  
            function(response: Response) {
            if (response.status !== 200) {
                // ERROR
                return;
            }
        
            response.json().then(function(data: DealOfTheDay) {
                app.setState(data);
            });
            }  
        )  
        .catch(function(err: Error) {
            // Error
        });
    }
}

export default DealOfTheDay;