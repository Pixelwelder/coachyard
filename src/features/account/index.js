import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Dialog from '@material-ui/core/Dialog';
import Button from '@material-ui/core/Button';

import { actions as uiActions, selectors as uiSelectors } from '../ui/uiSlice';
import { selectors as userSelectors } from '../app/userSlice';
import ItemDetails from '../../components/ItemDetails';
import Billing from '../billing';

const Account = () => {
  const { showAccount } = useSelector(uiSelectors.select);
  const { isSignedIn, meta } = useSelector(userSelectors.select);
  const dispatch = useDispatch();

  const onClose = () => {
    dispatch(uiActions.setShowAccount(false));
  };

  return (
    <Dialog open={showAccount} onClose={onClose} aria-labelledby="form-dialog-title" fullWidth>
      <DialogTitle id="account-dialog">Account</DialogTitle>
      <DialogContent>
        {isSignedIn && (
          <>
            <ItemDetails item={{
              uid: meta.uid,
              email: meta.email
            }}/>
            <Billing />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Account;
