import React from 'react';
import { actions as uiActions2, selectors as uiSelectors2 } from '../features/ui/uiSlice2';
import { selectors as appSelectors } from '../features/app/appSlice';
import { useSelector } from 'react-redux';
import app from 'firebase/app';
import { StyledFirebaseAuth } from 'react-firebaseui';
import DialogTitle from '@material-ui/core/DialogTitle';
import SESSION_MODES from '../constants/sessionModes';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText/DialogContentText';
import Dialog from '@material-ui/core/Dialog';

const uiConfig = {
  signInFlow: 'popup',
  callbacks: {
    // Avoid redirects after sign-in.
    signInSuccessWithAuthResult: (authResult) => {
      console.log('success', authResult)
    },
  },
  signInOptions: [
    app.auth.GoogleAuthProvider.PROVIDER_ID,
    app.auth.EmailAuthProvider.PROVIDER_ID
  ]
};

const FirebaseSignIn = () => {
  const { createAccount: actions } = uiActions2;
  const { createAccount: selectors } = uiSelectors2;
  const { displayName, email, password, mode, isOpen, isLoading, error } = useSelector(selectors.select);

  const { signInAttempted } = useSelector(appSelectors.select);

  return (
    <Dialog
      className="session" open={isOpen}
      aria-labelledby="form-dialog-title"
      fullWidth
    >
      <DialogTitle id="form-dialog-title">
        {mode === SESSION_MODES.SIGN_IN ? 'Welcome Back!' : 'Welcome!'}
      </DialogTitle>
      <DialogContent>
        {/*<DialogContentText>*/}
        {/*  Hello!*/}
        {/*</DialogContentText>*/}
        {signInAttempted && (
          <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={app.auth()} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FirebaseSignIn;
