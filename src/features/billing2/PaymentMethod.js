import React, { useState } from 'react';
import { CardElement, useElements } from '@stripe/react-stripe-js';
import Button from '@material-ui/core/Button';

const PaymentMethod = ({ paymentMethods, onSubmit }) => {
  console.log('PaymentMethod', paymentMethods);
  const elements = useElements();
  const [isComplete, setIsComplete] = useState(false);
  const paymentMethod = paymentMethods.length ? paymentMethods[0] : null;

  const onCardChange = (event) => {
    setIsComplete(event.complete);
  };

  const onAttemptSubmit = () => {
    const card = elements.getElement(CardElement);
    onSubmit({ card });
  };

  const isDisabled = () => (paymentMethod ? true : !isComplete);

  return (
    <form onSubmit={onSubmit} className="payment-method">
      {/* {paymentMethod && ( */}
      {/*  <div className="payment-method"> */}
      {/*    <Typography>{capitalize(paymentMethod.card.brand)} {paymentMethod.card.last4}</Typography> */}
      {/*  </div> */}
      {/* )} */}

      {!paymentMethod && (
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
      )}
      <Button
        className="payment-button"
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

export default PaymentMethod;
