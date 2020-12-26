import React from 'react';
import app from 'firebase/app';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useSelector } from 'react-redux';
import { selectors as billingSelectors } from './billingSlice';

const Billing = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { setup_secret, customer_id } = useSelector(billingSelectors.select);

  const onSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    const card = elements.getElement(CardElement);
    console.log('card', card);

    // TODO Move this to an async thunk.
    const createPaymentMethod = async () => {
      const paymentMethodResult = await stripe.createPaymentMethod({
        type: 'card',
        card
      });
      console.log('payment method created', paymentMethodResult);

      if (paymentMethodResult.error) {
        console.error(paymentMethodResult.error);
      } else {
        const { uid } = app.auth().currentUser;
        console.log('adding to database', uid);
        try {
          const result = await app.firestore()
            .collection('stripe_customers')
            .doc(uid)
            .collection('subscriptions')
            .add({ type: 'subscription' });
        } catch (error) {
          console.error(error);
        }

        console.log('added');
      }
    };

    await createPaymentMethod();
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
