import React from 'react';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText/DialogContentText';
import Dialog from '@material-ui/core/Dialog';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import Button from '@material-ui/core/Button';
import { useDispatch, useSelector } from 'react-redux';
import { selectors as selectedCourseSelectors } from '../course/selectedCourseSlice';
import { toDollars } from '../../util/currency';
import { actions as billingActions2 } from './billingSlice2';

const UnlockDialog = ({ isOpen = true }) => {
  const { course } = useSelector(selectedCourseSelectors.select);
  const dispatch = useDispatch();
  const stripe = useStripe();
  const elements = useElements();

  const onCancel = () => {};

  const onUnlock = () => {
    const card = elements.getElement(CardElement);
    dispatch(billingActions2.unlockCourse({ stripe, card }));
  };

  const isDisabled = () => false;

  if (!course) return null;
  return (
    <Dialog
      fullWidth
      open={isOpen}
      onClose={onCancel}
      aria-labelledby="form-dialog-title"
    >
      <DialogTitle id="form-dialog-title">
        Unlock "{course.displayName}"
      </DialogTitle>
      <DialogContent className="unlock-dialog-content">
        <DialogContentText>
          Unlock!
        </DialogContentText>
        <CardElement
          className="credit-card"
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
          onClick={onUnlock}
          disabled={isDisabled()}
        >
          Purchase for {toDollars(course.price)}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default UnlockDialog;
