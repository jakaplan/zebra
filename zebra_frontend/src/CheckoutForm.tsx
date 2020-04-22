import React, { Component } from 'react';
import { Stripe, StripeElements } from '@stripe/stripe-js';
import {ElementsConsumer, CardElement} from '@stripe/react-stripe-js';
import './CheckoutForm.css';

/**
 * Styling elements for the CardElement which takes in credit card payment info
 */
const CARD_ELEMENT_OPTIONS = {
    style: {
        base: {
            color: "#32325d",
            fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
            fontSmoothing: "antialiased",
            fontSize: "16px",
            "::placeholder": {
                color: "#aab7c4",
            }
        },
        invalid: {
            color: "#fa755a",
            iconColor: "#fa755a",
        }
    },
};

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
    errorMessage?: string;
    name: string;
    email: string;
    address: string;
    city: string;
    state: string;
}

/** Error message user will see if a more specific error message doesn't exist */
const DEFAULT_ERROR_MESSAGE = "Something went wrong, please try again";

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
                      name: '',
                      email: '',
                      address: '',
                      city: '',
                      state: 'California'};
        this.processSubmission = this.processSubmission.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
    }

    /**
     * Async sends payment information not including credit card info and returns
     * the client secret from the server for the deal of the day item.
     * 
     * @returns client secret
     * @throws if non-200 status code is returned by server
     */
    async fetchClientSecret(): Promise<string> {
        let response = await fetch('/api/begin_payment', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                name: this.state.name,
                email: this.state.email,
                address: this.state.address,
                city: this.state.city,
                state: this.state.state })
        });
        
        if(response.status === 200) {
            return (await response.json())['client_secret'];
        }
        else {
            throw Error("Unable to fetch client secret, got response code: " + response.status);
        }
    }

    /**
     * Handles the button press by processing a payment submission
     * 
     * @param event submission event from button
     */
    async processSubmission(event: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) {
        event.preventDefault();

        // Only process payment submission if Stripe.js has loaded
        if(this.props.stripe && this.props.elements) {

            // Validate input for the non-payment fields
            if(this.validateInput()) {
                // If card element is in the view hierarchy
                let card = this.props.elements.getElement(CardElement);
                if(card) {
                    // Update state to reflect we're going to be submitting the payment info
                    this.setState({submissionStatus: SubmissionStatus.Submitting});

                    try {
                        let clientSecret = await this.fetchClientSecret();

                        const result = await this.props.stripe.confirmCardPayment(clientSecret, {
                            payment_method: {
                                card: card,
                                billing_details: {
                                    address: {
                                        line1: this.state.address,
                                        city: this.state.city,
                                        state: this.state.state,
                                        country: "US"
                                    },
                                    email: this.state.email,
                                    name: this.state.name,
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
        }
        // Stripe.js wasn't initialized for some reason
        else {
            this.setGenericPaymentFailure();
        }
    }

    /**
     * Catch all user messaging when something goes wrong in processing the payment
     */
    setGenericPaymentFailure() {
        this.setState({submissionStatus: SubmissionStatus.SubmissionFailed,
                       errorMessage: DEFAULT_ERROR_MESSAGE});
    }

    /**
     * Check all non-payment fields have been filled out
     */
    validateInput(): boolean {
        let allInputsPassedValidation = true;

        if(!this.state.name) {
            this.setState({submissionStatus: SubmissionStatus.SubmissionFailed,
                           errorMessage: "Please provide your name"});
            allInputsPassedValidation = false;
        }
        else if(!this.state.email) {
            this.setState({submissionStatus: SubmissionStatus.SubmissionFailed,
                           errorMessage: "Please provide your email"});
            allInputsPassedValidation = false;
        }
        else if(!this.state.address) {
            this.setState({submissionStatus: SubmissionStatus.SubmissionFailed,
                           errorMessage: "Please provide your address"});
            allInputsPassedValidation = false;
        }
        else if(!this.state.city) {
            this.setState({submissionStatus: SubmissionStatus.SubmissionFailed,
                           errorMessage: "Please provide your city"});
            allInputsPassedValidation = false;
        }
        else if(!this.state.state) {
            this.setState({submissionStatus: SubmissionStatus.SubmissionFailed,
                           errorMessage: "Please provide your state"});
            allInputsPassedValidation = false;
        }

        return allInputsPassedValidation;
    }

    /**
     * Updates React's state based on what's been input into the input/select elements
     */
    handleInputChange(event: React.FormEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement>) {
        const name = event.currentTarget.name;
        const value = event.currentTarget.value;
        switch(name) {
            case 'name':
                this.setState({name: value});
                break;
            case 'email':
                this.setState({email: value});
                break;
            case 'address':
                this.setState({address: value});
                break;
            case 'city':
                this.setState({city: value});
                break;
            case 'state':
                this.setState({state: value});
                break;
        }
    }

    /**
     * Renders the UI for this component
     */
    render() {
        // If Stripe.JS hasn't initialized yet, don't show any payment UI
        if(!this.props.stripe || !this.props.elements) {
            console.log("render :: Stripe.JS hasn't initialized yet")
            return (
                <div>
                    One moment...
                </div>
            );
        }
        // Otherwise render UI based on submission status
        else {
            let status = this.state.submissionStatus;
            
            // Determine whether to show a message and if so which one
            let showMessage = (status !== SubmissionStatus.NotSubmitted) ? 'block' : 'none';
            let messageColor = (status === SubmissionStatus.SubmissionFailed) ? 'red' : 'white';
            let message : string | undefined;
            if(status === SubmissionStatus.SubmissionFailed) {
                message = this.state.errorMessage;
            }
            else if(status === SubmissionStatus.Submitting) {
                message = "Processing...";
            }
            else if(status === SubmissionStatus.SubmissionSucceeded) {
                message = "Thanks for purchasing!";
            }

            // Determine if the form should be shown
            let displayForm = (status === SubmissionStatus.NotSubmitted ||
                               status === SubmissionStatus.SubmissionFailed) ? 'block' : 'none';

            return (
                <div>
                    <div className="CheckoutForm-error" style={{display: showMessage, color: messageColor}}>
                        {message}
                    </div>

                    <form onSubmit={this.processSubmission} style={{display: displayForm}}>
                        <div className="CheckoutForm-row">
                            <input type="text" 
                                   className="CheckoutForm-name"
                                   name="name"
                                   value={this.state.name}
                                   onChange={this.handleInputChange}
                                   placeholder="Name"/>
                        </div>

                        <div className="CheckoutForm-row">
                            <input type="email"
                                   className="CheckoutForm-email"
                                   name="email"
                                   value={this.state.email}
                                   onChange={this.handleInputChange}
                                   placeholder="Email"/>
                        </div>

                        <div className="CheckoutForm-row">
                            <input type="text"
                                   className="CheckoutForm-address"
                                   name="address"
                                   value={this.state.address}
                                   onChange={this.handleInputChange}
                                   placeholder="Address"/>
                        </div>

                        <div className="CheckoutForm-row">
                            <input type="text"
                                   className="CheckoutForm-city"
                                   name="city"
                                   value={this.state.city}
                                   onChange={this.handleInputChange}
                                   placeholder="City"/>
                        </div>

                        <div className="CheckoutForm-row">
                            <select name="state"
                                    value={this.state.state}
                                    onChange={this.handleInputChange}>
                                <option>Alabama</option>
                                <option>Alaska</option>
                                <option>Arizona</option>
                                <option>Arkansas</option>
                                <option>California</option>
                                <option>Colorado</option>
                                <option>Connecticut</option>
                                <option>Delaware</option>
                                <option>Florida</option>
                                <option>Georgia</option>
                                <option>Hawaii</option>
                                <option>Idaho</option>
                                <option>Illinois</option>
                                <option>Indiana</option>
                                <option>Iowa</option>
                                <option>Kansas</option>
                                <option>Kentucky</option>
                                <option>Louisiana</option>
                                <option>Maine</option>
                                <option>Maryland</option>
                                <option>Massachusetts</option>
                                <option>Michigan</option>
                                <option>Minnesota</option>
                                <option>Mississippi</option>
                                <option>Missouri</option>
                                <option>Montana</option>
                                <option>Nebraska</option>
                                <option>Nevada</option>
                                <option>New Hampshire</option>
                                <option>New Jersey</option>
                                <option>New Mexico</option>
                                <option>New York</option>
                                <option>North Carolina</option>
                                <option>North Dakota</option>
                                <option>Ohio</option>
                                <option>Oklahoma</option>
                                <option>Oregon</option>
                                <option>Pennsylvania</option>
                                <option>Rhode Island</option>
                                <option>South Carolina</option>
                                <option>South Dakota</option>
                                <option>Tennessee</option>
                                <option>Texas</option>
                                <option>Utah</option>
                                <option>Vermont</option>
                                <option>Virginia</option>
                                <option>Washington</option>
                                <option>West Virginia</option>
                                <option>Wisconsin</option>
                                <option>Wyoming</option>
                            </select>
                        </div>

                        <div className="CheckoutForm-row">
                            <CardElement options={CARD_ELEMENT_OPTIONS}/>
                        </div>

                        <div className="CheckoutForm-row">
                            <button className="CheckoutForm-button">Confirm order</button>
                        </div>
                    </form>
                </div>
            );
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