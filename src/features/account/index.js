import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import app from 'firebase/app';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Dialog from '@material-ui/core/Dialog';
import Button from '@material-ui/core/Button';

import { actions as uiActions2, selectors as uiSelectors2 } from '../ui/uiSlice2';
import { selectors as userSelectors } from '../app/userSlice';
import Billing from '../billing';
import { Typography } from '@material-ui/core';

const Account = () => {
  const { account: selectors } = uiSelectors2;
  const { account: actions } = uiActions2;
  const { isOpen, isLoading, error } = useSelector(selectors.select);

  const { isSignedIn, meta, image } = useSelector(userSelectors.select);
  const authUser = app.auth().currentUser;
  const dispatch = useDispatch();

  const onClose = () => {
    dispatch(uiActions2.account.reset());
  };

  return (
    <Dialog open={isOpen} onClose={onClose} aria-labelledby="form-dialog-title" fullWidth>
      <DialogTitle id="account-dialog">Account</DialogTitle>
      <DialogContent className="account-dialog-content">
        {image && (
          <img
            src={image}
            width={200}
            height={200}
          />
        )}
        <Typography variant="h4">{authUser?.displayName}</Typography>
        <Typography variant="h5">{authUser?.email}</Typography>
        <Billing />
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
