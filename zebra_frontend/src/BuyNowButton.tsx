import React, { Component, MouseEvent } from 'react';

interface BuyNowButtonProps {
    showCheckoutForm: () => void;
}

class BuyNowButton extends Component<BuyNowButtonProps> {
    constructor(props: BuyNowButtonProps) {
        super(props);

        this.handleClick = this.handleClick.bind(this);
    }

    render() {
        return (
            <button onClick={this.handleClick}>Buy now!</button>
        );
    }

    handleClick(event: MouseEvent) {
        event.preventDefault();

        this.props.showCheckoutForm();
    }
}

export default BuyNowButton;