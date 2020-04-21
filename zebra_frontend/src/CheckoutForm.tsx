import React, { Component } from 'react';
import { Stripe, StripeElements } from '@stripe/stripe-js';
import {ElementsConsumer, CardElement} from '@stripe/react-stripe-js';
import CardSection from './CardSection';

/** 
 * Different states the submission can be in
 */
enum SubmissionStatus {
    NotSubmitted,
    Submitting,
    SubmissionSucceeded,
    SubmissionFailed
}

interface CheckoutFormProps {
    stripe: Stripe | null;
    elements: StripeElements | null;
}

interface CheckoutFormState {
    submissionStatus: SubmissionStatus;
    errorMessage: string | null;
}

/** Error message user will see if a more specific error message doesn't exist */
const DEFAULT_ERROR_MESSAGE = "Something went wrong, please refresh this page and try again";

/**
 * Form shown to user to take their billing information and show them progress, success, and error
 * states.
 */
class CheckoutForm extends Component<CheckoutFormProps, CheckoutFormState> {

    /**
     * Initializes state for the CheckoutForm
     */
    constructor(props: CheckoutFormProps) {
        super(props);

        this.state = {submissionStatus: SubmissionStatus.NotSubmitted,
                      errorMessage: null};
        this.processSubmission = this.processSubmission.bind(this);
    }

    /**
     * Async returns the client secret from the server for the deal of the day.
     * 
     * @returns client secret
     * @throws if non-200 status code is returned by server
     */
    async fetchClientSecret(): Promise<string> {
        let response: Response = await fetch('/api/secret');
        if(response.status === 200) {
            return (await response.json())['client_secret'];
        } else {
            throw Error("Unable to fetch client secret, got response code: " + response.status);
        }
    }

    /**
     * Handles the button press by processing a payment submission
     * 
     * @param event submission event from button
     */
    async processSubmission(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        // Only process payment submission if Stripe.js has loaded
        if(this.props.stripe && this.props.elements) {
            
            // If card element is in the view hierarchy
            let card = this.props.elements.getElement(CardElement);
            if(card) {
                this.setState({submissionStatus: SubmissionStatus.Submitting});

                try {
                    let clientSecret = await this.fetchClientSecret();

                    console.log("clientSecret received");

                    const result = await this.props.stripe.confirmCardPayment(clientSecret, {
                        payment_method: {
                            card: card,
                            billing_details: {
                                name: 'Jenny Rosen',
                            },
                        }
                    });

                    // Error
                    if (result.error) {
                        let errorMessage = result.error.message || DEFAULT_ERROR_MESSAGE;
                        this.setState({submissionStatus: SubmissionStatus.SubmissionFailed,
                                    errorMessage: errorMessage});

                        console.log(errorMessage);
                    }
                    // Success!
                    else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
                        this.setState({submissionStatus: SubmissionStatus.SubmissionSucceeded});
                    }
                    // Something else went wrong despite there being no error
                    else {
                        this.setGenericPaymentFailure();
                    }
                } catch(err) {
                    this.setGenericPaymentFailure();
                    console.log("Catch clause of process submission reached, error: " + err);
                }
            }
            // Unable to fetch card element 
            else {
                this.setGenericPaymentFailure();
            }
        }
        // Stripe.js wasn't initialized for some reason
        else {
            this.setGenericPaymentFailure();
        }
    } 

    /**
     * Catch all error when something goes wrong in processing the payment
     */
    setGenericPaymentFailure() {
        this.setState({submissionStatus: SubmissionStatus.SubmissionFailed,
                       errorMessage: DEFAULT_ERROR_MESSAGE});
    }

    /**
     * Renders the UI for this component
     */
    render() {
        // If Stripe.JS hasn't initialized yet, don't show any payment UI
        if(!this.props.stripe || !this.props.elements) {
            return (
                <div>
                    One moment...
                </div>
            );
        }
        // Otherwise render UI based on submission status
        else {
            switch(this.state.submissionStatus) {
                case SubmissionStatus.NotSubmitted:
                    return (
                        <form onSubmit={this.processSubmission}>
                            <CardSection visible={true}/>
                            <button>Confirm order</button>
                        </form>
                    );
                case SubmissionStatus.Submitting:
                    // It's essential that the form and card section remain in the
                    // view hierarchy when submitting such that getElement(CardElement)
                    // call can find the card element succesfully. However, we don't
                    // want the user to see it, so hide it visually.
                    return (
                        <form>
                            <CardSection visible={false}/>
                            <div>One moment...</div>
                        </form>
                    );
                case SubmissionStatus.SubmissionSucceeded:
                    return (
                        <div>
                            Purchased
                        </div>
                    );
                case SubmissionStatus.SubmissionFailed:
                    return (
                        <form onSubmit={this.processSubmission}>
                            <div>{this.state.errorMessage}</div>
                            <CardSection visible={true}/>
                            <button>Confirm order</button>
                        </form>
                    );
            }
        }
    }
}

export default function InjectedCheckoutForm() {
    return (
        <ElementsConsumer>
            {({stripe, elements}) => (
                <CheckoutForm stripe={stripe} elements={elements} />
            )}
        </ElementsConsumer>
    );
}