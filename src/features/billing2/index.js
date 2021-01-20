import React from 'react';
import { selectors as billingSelectors2, actions as billingActions2 } from './billingSlice2';
import { useDispatch, useSelector } from 'react-redux';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

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
  const tiers = useSelector(billingSelectors2.selectTiers);
  const actualSelectedTier = useSelector(billingSelectors2.selectUserTier);
  const { selectedTierId } = useSelector(billingSelectors2.select);
  const dispatch = useDispatch();

  return (
    <div className="billing page">
      <ul className="tier-list">
        {tiers.map((tier, index) => (
          <Tier
            tier={tier}
            selected={selectedTierId === tier.id}
            subscribed={actualSelectedTier === tier.id}
            key={index}
            onClick={() => {
              dispatch(billingActions2.setSelectedTierId(tier.id));
            }}
          />
        ))}
      </ul>
      <Button
        className="change-plan-button"
        variant="contained"
        color="primary"
        onClick={() => dispatch(billingActions2.setTier({ id: selectedTierId }))}
        disabled={actualSelectedTier === selectedTierId}
      >
        {`${actualSelectedTier === 0 ? 'Choose' : 'Change'} Plan`}
      </Button>

      <Button
        size="small"
        className="cancel-plan-button"
        onClick={() => dispatch(billingActions2.setTier({ id: selectedTierId }))}
        disabled={actualSelectedTier === 0}
      >
        Cancel Plan
      </Button>
    </div>
  );
};

export default Billing;
