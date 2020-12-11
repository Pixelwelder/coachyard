import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Dialog from '@material-ui/core/Dialog';
import DialogContentText from '@material-ui/core/DialogContentText/DialogContentText';
import Button from '@material-ui/core/Button';
import app from 'firebase/app';

import { actions as uiActions, selectors as uiSelectors } from '../ui/uiSlice';
import { actions as appActions, selectors as appSelectors } from '../app/appSlice';
import { ItemDetails } from '../admin/ItemDetails';
import PrivilegesView from '../../components/PrivilegesView';

const Account = () => {
  const { showAccount } = useSelector(uiSelectors.select);
  const { authUser } = useSelector(appSelectors.select);
  const dispatch = useDispatch();

  // useEffect(() => {
  //   const go = async () => {
  //     const authToken = await app.auth().currentUser.getIdTokenResult(true);
  //     console.log('authToken', authToken.claims);
  //   };
  //
  //   if (showAccount) go();
  // }, [showAccount]);

  const onClose = () => {
    dispatch(uiActions.setShowAccount(false));
  }

  const onSignOut = () => {
    onClose();
    dispatch(appActions.signOut());
  }

  return (
    <Dialog open={showAccount} onClose={onClose} aria-labelledby="form-dialog-title" fullWidth>
      <DialogTitle id="account-dialog">Account</DialogTitle>
      <DialogContent>
        {authUser && (
          <>
            <ItemDetails item={{
              uid: authUser.uid,
              email: authUser.email,
              // customClaims: authUser.customClaims
            }}/>
            <PrivilegesView privileges={authUser?.claims?.privileges || 0} />
          </>
        )}
        {/*<Button onClick={onSignOut} variant={'contained'}>Sign Out</Button>*/}
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
