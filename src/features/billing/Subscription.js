import React, { useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import Button from '@material-ui/core/Button';
import { selectors as billingSelectors2, actions as billingActions2 } from '../billing2/billingSlice2';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import Typography from '@material-ui/core/Typography';
import app from 'firebase/app';

const Subscription = () => {
  const sub = useSelector(billingSelectors2.selectSubscription);
  const getDate = () => DateTime.fromSeconds(sub.current_period_end).toLocal().toFormat('LLL d, yyyy');
  const [remaining, setRemaining] = useState(0);
  const tier = useSelector(billingSelectors2.selectTier);

  // TODO Use redux.
  useEffect(() => {
    const execute = async () => {
      const authUser = app.auth().currentUser;
      const { claims: { remaining = 0 } } = await authUser.getIdTokenResult(true);
      setRemaining(remaining);
    };
    execute();
  }, []);

  return (
    <div>
      {!sub && (
        <Typography>No subscription</Typography>
      )}
      {sub && (
        <>
          <Typography>{tier.displayName} Plan</Typography>
          <Typography>{(remaining / 60).toFixed(1)} hours remaining</Typography>
          {sub.cancel_at_period_end && (<Typography>Ends: {getDate()}</Typography>)}
          {!sub.cancel_at_period_end && (<Typography>Renews: {getDate()}</Typography>)}
        </>
      )}
    </div>
  );
};

export default Subscription;
