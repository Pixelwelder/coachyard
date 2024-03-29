import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { DateTime } from 'luxon';
import { Link } from 'react-router-dom';
import { selectors as billingSelectors2, actions as billingActions2 } from './billingSlice2';
import PaymentMethod from './PaymentMethod';

const Tier = ({
  tier, selected, subscribed, onClick
}) => (
  <li className={`tier-item${selected ? ' selected' : ''}${subscribed ? ' subscribed' : ''}`} onClick={onClick}>
    <div className="tier-item-container">
      <Typography className="tier-item-title" variant="h4" component="h2">{tier.displayName}</Typography>
      <Typography className="tier-item-units">
        {tier.unitsAmount}
        {' '}
        {tier.unitsName}
      </Typography>
      <Typography className="tier-item-price">
        $
        {tier.price}
      </Typography>
      <Typography className="tier-item-period">{tier.period}</Typography>
      <div className="spacer" />
      <Typography className="tier-item-subscribed">Currently Subscribed</Typography>
    </div>
  </li>
);

const Billing = () => {
  const {
    isLoading,
    tiers,
    tier: actualTierId,
    ui: { selectedTierId, showBilling },
    paymentMethods
  } = useSelector(billingSelectors2.select);
  const subscription = useSelector(billingSelectors2.selectSubscription);
  const dispatch = useDispatch();
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    if (!tiers.length) {
      dispatch(billingActions2.getTiers());
    }
  }, [tiers])

  const onSubmit = ({ card }) => {
    dispatch(billingActions2.createSubscription({ stripe, card }));
  };

  const isDisabled = () => (actualTierId === selectedTierId)
      || !stripe
      || isLoading;

  const exists = () => !!subscription;

  const isCanceled = () => subscription?.cancel_at_period_end;

  const shouldShowBilling = () => showBilling;

  const shouldShowGetStarted = () => (actualTierId === 0 && selectedTierId !== 0)
      && !showBilling;

  // TODO Show this when in canceled-but-still-running mode.
  const shouldShowUpdate = () => ((actualTierId !== 0) && (selectedTierId !== actualTierId) && !shouldShowBilling())
      || (exists() && isCanceled());

  const shouldShowCancel = () => actualTierId !== 0
      && (!isCanceled());

  const onGetStarted = () => {
    dispatch(billingActions2.setUI({ showBilling: true }));
  };

  // TODO Not ideal that this knows about the Card in a child component.
  const onUpdatePlan = () => {
    const card = elements.getElement(CardElement);
    dispatch(billingActions2.updateSubscription({ stripe, card }));
  };

  return (
    <div className="billing page">
      <Link to="/dashboard">{'< Dashboard'}</Link>
      <ul className="tier-list">
        {tiers.map((tier, index) => (
          <Tier
            tier={tier}
            selected={selectedTierId === tier.id}
            subscribed={actualTierId === tier.id}
            key={index}
            onClick={() => {
              dispatch(billingActions2.setUI({ selectedTierId: tier.id }));
            }}
          />
        ))}
      </ul>

      {subscription && (
        <div className="subscription-info">
          {subscription.cancel_at_period_end && (<p>Cancels at</p>)}
          {!subscription.cancel_at_period_end && (<p>Renews at</p>)}
          <p>{DateTime.fromSeconds(subscription.current_period_end).toLocal().toString()}</p>
        </div>
      )}

      {shouldShowGetStarted() && (
        <Button
          className="change-plan-button"
          variant="contained"
          color="primary"
          onClick={onGetStarted}
        >
          Get Started
        </Button>
      )}

      {shouldShowUpdate() && (
        <Button
          className="change-plan-button"
          variant="contained"
          color="primary"
          onClick={onUpdatePlan}
        >
          Change Plan
        </Button>
      )}

      {shouldShowBilling() && (
        <PaymentMethod
          paymentMethods={paymentMethods}
          onSubmit={onSubmit}
        />
      )}

      {/* TODO Reconsider. */}
      {shouldShowCancel() && (
        <Button
          size="small"
          type="button"
          className="cancel-plan-button"
          // onClick={() => dispatch(billingActions2.setTier({ id: 0 }))}
          onClick={() => dispatch(billingActions2.cancelSubscription())}
        >
          Cancel Plan
        </Button>
      )}
    </div>
  );
};

export default Billing;
