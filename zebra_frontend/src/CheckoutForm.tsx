import React from 'react';
import { Stripe, StripeElements } from '@stripe/stripe-js';
import {ElementsConsumer, CardElement} from '@stripe/react-stripe-js';
import CardSection from './CardSection';

interface CheckoutFormProps {
    stripe: Stripe | null;
    elements: StripeElements | null;
}

interface CheckoutFormState {
    paymentSubmitted: boolean;
    errorMessage: string | null;
}

interface ClientSecret {
    client_secret: string;
}

class CheckoutForm extends React.Component<CheckoutFormProps, CheckoutFormState> {
    state = {paymentSubmitted: false,
             errorMessage: null};

    handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        // We don't want to let default form submission happen here,
        // which would refresh the page.
        event.preventDefault();

        // Proceed only if Stripe.js has loaded
        // TODO: Make sure to disable form submission until Stripe.js has loaded.
        if (this.props.stripe && this.props.elements) {
            const stripe = this.props.stripe;
            const elements = this.props.elements;

            this.setState({paymentSubmitted: true});

            fetch('/api/secret')
            .then(
                function(response: Response) {
                    if (response.status === 200) {
                        console.log("Talked to server");
                        console.log(response);

                        response.json().then(async function(data: ClientSecret) {
                            console.log(data.client_secret);

                            // TODO: stripe.confirmCardPayment may take several seconds to complete.
                            // During that time, disable your form from being resubmitted and show a
                            // waiting indicator like a spinner. If you receive an error, show it to the customer,
                            // re-enable the form, and hide the waiting indicator.
                            let card = elements.getElement(CardElement);
                            if(card) {
                                const result = await stripe.confirmCardPayment(data.client_secret, {
                                    payment_method: {
                                        card: card,
                                        billing_details: {
                                            name: 'Jenny Rosen',
                                        },
                                    }
                                });
                    
                                if (result.error) {
                                    // Show error to your customer (e.g., insufficient funds)
                                    console.log(result.error.message);
                                } else {
                                    // The payment has been processed!
                                    if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
                                        // Show a success message to your customer
                                        // There's a risk of the customer closing the window before callback
                                        // execution. Set up a webhook or plugin to listen for the
                                        // payment_intent.succeeded event that handles any business critical
                                        // post-payment actions.
                                        console.log("Payment succeeded!")
                                    }
                                }
                            }
                        });
                    }
                }
            )
            .catch()
        }
    }

    disableConfirmationButton(): boolean {
        return this.state.paymentSubmitted || !this.props.stripe;
    }

    render() {
        return (
            <form onSubmit={this.handleSubmit}>
                <CardSection />
                <button disabled={this.disableConfirmationButton()}>Confirm order</button>
            </form>
        );
    }
}

export default function InjectedCheckoutForm() {
    return (
        <ElementsConsumer>
            {({stripe, elements}) => (
                <CheckoutForm  stripe={stripe} elements={elements} />
            )}
        </ElementsConsumer>
    );
}