import React from 'react';
import { selectors as billingSelectors2, actions as billingActions2 } from './billingSlice2';
import { useDispatch, useSelector } from 'react-redux';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';

const Tier = ({ tier, selected, subscribed, onClick }) => {
  return (
    <li className={`tier-item${selected ? ' selected' : ''}${subscribed ? ' subscribed' : ''}`} onClick={onClick}>
      <div className="tier-item-container">
        <Typography className="tier-item-title" variant="h4" component="h2">{tier.displayName}</Typography>
        <Typography className="tier-item-units">{tier.unitsAmount} {tier.unitsName}</Typography>
        <Typography className="tier-item-price">${tier.price}</Typography>
        <Typography className="tier-item-period">{tier.period}</Typography>
        <div className="spacer" />
        {/*<Button*/}
        {/*  className="tier-item-button"*/}
        {/*  variant="contained"*/}
        {/*  color="primary"*/}
        {/*  onClick={onClick}*/}
        {/*  disabled={selected}*/}
        {/*>*/}
        {/*  Select*/}
        {/*</Button>*/}
        <Typography className="tier-item-subscribed">Currently Subscribed</Typography>
      </div>
    </li>
  );
};

const Billing = () => {
  const {
    isLoading,
    tiers,
    ui: { selectedTierId, actualTierId, showBilling }
  } = useSelector(billingSelectors2.select);
  const dispatch = useDispatch();
  const stripe = useStripe();
  const elements = useElements();

  const onSubmit = () => {};

  const isDisabled = () => {
    return (actualTierId === selectedTierId)
      || !stripe
      || isLoading;
  };

  const shouldShowBilling = () => {
    return showBilling;
  };

  const shouldShowGetStarted = () => {
    return (actualTierId === 0 && selectedTierId !== 0)
      && !showBilling;
  };

  const shouldShowCancel = () => {
    return actualTierId !== 0;
  };

  const onGetStarted = () => {
    dispatch(billingActions2.setUI({ showBilling: true }));
  };

  const onSetTier = () => {
    // dispatch(billingActions2.setTier({ id: selectedTierId }));
    const card = elements.getElement(CardElement);
    dispatch(billingActions2.createSubscription({ stripe, card }))
  }

  return (
    <div className="billing page">
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

      {shouldShowBilling() && (
        <form onSubmit={onSubmit} className="card-container">
          <CardElement/>
          <Button
            className="change-plan-button"
            variant="contained"
            color="primary"
            onClick={onSetTier}
            disabled={isDisabled()}
          >
            {`${actualTierId === 0 ? 'Choose' : 'Change'} Plan`}
          </Button>
        </form>
      )}

      {shouldShowCancel() && (
        <Button
          size="small"
          type="button"
          className="cancel-plan-button"
          onClick={() => dispatch(billingActions2.setTier({ id: 0 }))}
        >
          Cancel Plan
        </Button>
      )}
    </div>
  );
};

export default Billing;
