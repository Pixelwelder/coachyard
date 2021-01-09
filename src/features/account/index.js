import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import app from 'firebase/app';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Dialog from '@material-ui/core/Dialog';
import Button from '@material-ui/core/Button';

import { actions as uiActions, selectors as uiSelectors } from '../ui/uiSlice';
import { selectors as userSelectors } from '../app/userSlice';
import ItemDetails from '../../components/ItemDetails';
import Billing from '../billing';
import { Typography } from '@material-ui/core';

const Account = () => {
  const { showAccount } = useSelector(uiSelectors.select);
  const { isSignedIn, meta, image } = useSelector(userSelectors.select);
  const authUser = app.auth().currentUser;
  const dispatch = useDispatch();

  const onClose = () => {
    dispatch(uiActions.setShowAccount(false));
  };

  return (
    <Dialog open={showAccount} onClose={onClose} aria-labelledby="form-dialog-title" fullWidth>
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
