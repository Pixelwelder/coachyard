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
import { actions as billingActions2, selectors as billingSelectors2 } from './billingSlice2';
import PaymentMethod from './PaymentMethod';
import { useHistory } from 'react-router-dom';

const UnlockDialog = () => {
  const history = useHistory();
  const { course } = useSelector(selectedCourseSelectors.select);
  const { ui: { showUnlock }, paymentMethods } = useSelector(billingSelectors2.select);
  const dispatch = useDispatch();
  const stripe = useStripe();
  const elements = useElements();

  const onCancel = () => {
    dispatch(billingActions2.setUI({ showUnlock: false }));
  };

  const onUnlock = ({ card } = {}) => {
    dispatch(billingActions2.unlockCourse({ stripe, card }));
  };

  if (!course) return null;
  return (
    <Dialog
      fullWidth
      open={showUnlock}
      onClose={onCancel}
      aria-labelledby="form-dialog-title"
    >
      <DialogTitle id="form-dialog-title">
        Unlock "{course.displayName}"
      </DialogTitle>
      <DialogContent className="unlock-dialog-content">
        <DialogContentText>
          Do you want to unlock this item?
        </DialogContentText>
        <div className="button-container">
          <Button className="cancel-button" variant="contained" color="default" onClick={onCancel}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={onUnlock}>Unlock</Button>
        </div>
        {/*{!!paymentMethods.length*/}
        {/*  ? <Button variant="contained" color="primary" onClick={onUnlock}>Unlock</Button>*/}
        {/*  : <PaymentMethod paymentMethods={paymentMethods} onSubmit={onUnlock} />*/}
        {/*}*/}
      </DialogContent>
    </Dialog>
  );
};

export default UnlockDialog;
