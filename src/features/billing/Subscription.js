import React, { useEffect } from 'react';
import { DateTime } from 'luxon';
import Button from '@material-ui/core/Button';
import { selectors as billingSelectors, actions as billingActions } from './billingSlice';
import { useDispatch, useSelector } from 'react-redux';

const Subscription = ({ onCancel }) => {
  const subscription = useSelector(billingSelectors.selectSubscription);
  const { ui } = useSelector(billingSelectors.select);
  const dispatch = useDispatch();

  if (!subscription) return null;

  const {
    cancel_at_period_end,
    plan,
    current_period_end,
    billing_cycle_anchor,
    status
  } = subscription;

  return (
    <div>
      <p>Plan</p>
      <p>Plan will renew {DateTime.fromSeconds(current_period_end).toLocaleString()}</p>
      {!ui.showConfirmCancel && (
        <Button onClick={() => dispatch(billingActions.setUI({ showConfirmCancel: true }))}>
          Cancel Plan
        </Button>
      )}
      {ui.showConfirmCancel && (
        <>
          <p>Are you sure?</p>
          <Button onClick={() => dispatch(billingActions.cancelSubscription())}>
            Yes, cancel my subscription
          </Button>
          <Button onClick={() => dispatch(billingActions.setUI({ showConfirmCancel: false }))}>
            Never mind
          </Button>
        </>
      )}
    </div>
  );
};

export default Subscription;
