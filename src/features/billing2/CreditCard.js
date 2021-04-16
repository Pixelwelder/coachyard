import React, { useState } from 'react';
import { CardElement, useElements } from '@stripe/react-stripe-js';
import Button from '@material-ui/core/Button';

const CreditCard = ({ onSubmit }) => {
  const elements = useElements();
  const [isComplete, setIsComplete] = useState(false);

  const onCardChange = (event) => {
    setIsComplete(event.complete);
  };

  const onAttemptSubmit = () => {
    const card = elements.getElement(CardElement);
    onSubmit({ card });
  };

  const isDisabled = () => {
    return !isComplete;
  }

  return (
    <form onSubmit={onSubmit} className="card-container">
      <CardElement
        onChange={onCardChange}
        options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': {
                color: '#aab7c4',
              },
            },
            invalid: {
              color: '#9e2146',
            },
          },
        }}
      />
      <Button
        className="change-plan-button"
        variant="contained"
        color="primary"
        onClick={onAttemptSubmit}
        disabled={isDisabled()}
      >
        Get Started
      </Button>
    </form>
  );
};

export default CreditCard;
