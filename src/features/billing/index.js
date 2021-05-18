import React from 'react';
import { useElements, useStripe } from '@stripe/react-stripe-js';
import { useDispatch, useSelector } from 'react-redux';
import { selectors as billingSelectors } from './billingSlice';
import Subscription from './Subscription';

const Billing = () => {
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useDispatch();
  const { ui } = useSelector(billingSelectors.select);
  const subscription = useSelector(billingSelectors.selectSubscription);

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
    </div>
  );
};

export default Billing;
