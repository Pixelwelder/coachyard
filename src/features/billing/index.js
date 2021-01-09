import React from 'react';
import app from 'firebase/app';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useDispatch, useSelector } from 'react-redux';
import { selectors as billingSelectors, actions as billingActions } from './billingSlice';
import Subscription from './Subscription';
import ConfirmationDialog from '../../components/ConfirmationDialog';

const Billing = () => {
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useDispatch();
  const { ui } = useSelector(billingSelectors.select);
  const subscription = useSelector(billingSelectors.selectSubscription);

  const onSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    const card = elements.getElement(CardElement);
    await dispatch(billingActions.createSubscription({ stripe, card }));
    console.log('onSubmit complete');
  }

  const onCancel = () => {
    console.log('Canceling plan...');
  };

  return (
    <div className="billing">
      <h2>Billing</h2>
      <Subscription
        subscription={subscription}
        onCancel={onCancel}
      />
      {!subscription && (
        <form onSubmit={onSubmit}>
          <CardElement />
          <button type="submit" onSubmit={onSubmit} disabled={!stripe}>Pay</button>
        </form>
      )}
    </div>
  )
};

export default Billing;
