import React, { useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { useSelector } from 'react-redux';
import Typography from '@material-ui/core/Typography';
import app from 'firebase/app';
import { selectors as billingSelectors2 } from '../billing2/billingSlice2';

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
      {/*{!sub && (*/}
      {/*  <Typography>createStripeCustomer</Typography>*/}
      {/*)}*/}
      {sub && (
        <>
          <Typography>
            {tier.displayName}
            {' '}
            Plan
          </Typography>
          <Typography>
            {(remaining / 60).toFixed(1)}
            {' '}
            hours remaining
          </Typography>
          {sub.cancel_at_period_end && (
          <Typography>
            Ends:
            {getDate()}
          </Typography>
          )}
          {!sub.cancel_at_period_end && (
          <Typography>
            Renews:
            {getDate()}
          </Typography>
          )}
        </>
      )}
    </div>
  );
};

export default Subscription;
