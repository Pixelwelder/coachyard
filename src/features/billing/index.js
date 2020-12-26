import React from 'react';
import app from 'firebase/app';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useDispatch, useSelector } from 'react-redux';
import { selectors as billingSelectors, actions as billingActions } from './billingSlice';

const Billing = () => {
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useDispatch();
  const { setup_secret, customer_id } = useSelector(billingSelectors.select);

  const onSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    const card = elements.getElement(CardElement);
    await dispatch(billingActions.createSubscription({ stripe, card }));
    console.log('onSubmit complete');
  }

  return (
    <div>
      <h2>Billing</h2>
      <form onSubmit={onSubmit}>
        <CardElement />
        <button type="submit" onSubmit={onSubmit} disabled={!stripe}>Pay</button>
      </form>
    </div>
  )
};

export default Billing;
