import React, { useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import app from 'firebase/app';
// import { StyledFirebaseAuth } from 'react-firebaseui';
import DialogTitle from '@material-ui/core/DialogTitle';
import SESSION_MODES from '../constants/sessionModes';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText/DialogContentText';
import Dialog from '@material-ui/core/Dialog';
import * as firebaseui from 'firebaseui';
import { actions as uiActions2, selectors as uiSelectors2 } from '../features/ui/uiSlice2';
import { selectors as appSelectors } from '../features/app/appSlice';
import { selectors as userSelectors } from '../features/app/userSlice';
import 'firebaseui/dist/firebaseui.css';

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
  const { isSignedIn } = useSelector(userSelectors.select);
  const ui = useRef(null);

  // Called when we have a node.
  const handleNode = useCallback((node) => {
    if (!ui.current) {
      ui.current = new firebaseui.auth.AuthUI(app.auth());
    }
    if (node) {
      ui.current.start(`#${node.id}`, uiConfig);
    }
  }, [isSignedIn]);

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
        <div id="firebase-auth" ref={handleNode} />
        {/*<DialogContentText>*/}
        {/*  Hello!*/}
        {/*</DialogContentText>*/}
        {/*{signInAttempted && (*/}
        {/*  // <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={app.auth()} />*/}
        {/*)}*/}
      </DialogContent>
    </Dialog>
  );
};

export default FirebaseSignIn;
