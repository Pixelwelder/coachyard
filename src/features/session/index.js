import React, { useState, useEffect } from 'react';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import TextField from '@material-ui/core/TextField';
import Alert from '@material-ui/lab/Alert';
import { useDispatch, useSelector } from 'react-redux';

import './session.scss';
import { selectors as sessionSelectors, actions as sessionActions } from './sessionSlice';
import { selectors as appSelectors, actions as appActions } from '../app/appSlice';
import SESSION_MODES from './sessionModes';

const isErrorType = type => error => !!error && error.message.toLowerCase().includes(type);

const Session = () => {
  const dispatch = useDispatch();
  const { mode } = useSelector(sessionSelectors.select);
  const { isLoading, error, authUser, query } = useSelector(appSelectors.select);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Clear any time the user changes.
  useEffect(() => { onClear(); }, [authUser]);

  useEffect(
    () => {
      // If we have an invitation, load it.
      const loadInvite = async () => {

      };

      if (query.invite) {
        loadInvite();
      }
    },
    [query]
  );

  const onClear = () => {
    setEmail('');
    setPassword('');
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    switch (mode) {
      case SESSION_MODES.SIGN_UP: {
        // await dispatch(appActions.signUp({ email, password }));
        await dispatch(appActions.signUp({ email, password, displayName, roles: 1 | 2 }));
        break;
      }

      case SESSION_MODES.SIGN_IN: {
        await dispatch(appActions.signIn({ email, password }));
        break;
      }

      default: {}
    }
  };

  const onToggle = () => {
    onClear();
    const newMode = mode === SESSION_MODES.SIGN_IN ? SESSION_MODES.SIGN_UP : SESSION_MODES.SIGN_IN;
    dispatch(sessionActions.setMode(newMode));
    dispatch(appActions.clearError());
  };

  // TODO Lotta overlap here.
  return (
    <Dialog
      className="session" open={!authUser.uid}
      aria-labelledby="form-dialog-title"
      fullWidth
    >
      <DialogTitle id="form-dialog-title">
        {mode === SESSION_MODES.SIGN_IN ? 'Welcome Back!' : 'Welcome!'}
      </DialogTitle>
      <DialogContent>
        {mode === SESSION_MODES.SIGN_UP && (
          <>
            <DialogContentText>Come on in, the water's fine!</DialogContentText>
            <form onSubmit={onSubmit}>
              <TextField
                variant="filled"
                id="displayName" value={displayName} disabled={isLoading} placeholder="name" autoComplete="name"
                onChange={({ target: { value } }) => setDisplayName(value)}
              />
              <TextField
                variant="filled"
                error={isErrorType('email')(error)}
                id="email" value={email} disabled={isLoading} placeholder="email" autoComplete="email"
                onChange={({ target: { value } }) => setEmail(value)}
              />
              <TextField
                variant="filled"
                id="password" type="password" autoComplete="current-password"
                value={password} disabled={isLoading} placeholder="password"
                onChange={({ target: { value }}) => setPassword(value)}
                error={isErrorType('password')(error)}
              />
              <button className="invisible" type="submit" />
            </form>
            {!!error && <Alert severity="error">{error.message}</Alert>}
            <p>Already got an account? <span className="link" onClick={onToggle}>Sign In</span></p>
          </>
        )}

        {mode === SESSION_MODES.SIGN_IN && (
          <>
            <DialogContentText>Good to see you again!</DialogContentText>
            <form onSubmit={onSubmit}>
              <TextField
                variant="filled" autoComplete="email"
                error={isErrorType('email')(error)}
                id="email" value={email} disabled={isLoading} placeholder="email"
                onChange={({ target: { value } }) => setEmail(value)}
              />
              <TextField
                variant="filled"
                id="password" type="password" autoComplete="current-password" value={password} disabled={isLoading} placeholder="password"
                onChange={({ target: { value }}) => setPassword(value)}
                error={isErrorType('password')(error)}
              />
              <button className="invisible" type="submit" />
            </form>
            {!!error && <Alert severity="error">{error.message}</Alert>}
            <p>Need an account? <span className="link" onClick={onToggle}>Sign Up</span></p>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onSubmit}
          color="primary"
          disabled={isLoading}
        >
          {mode === SESSION_MODES.SIGN_IN ? 'Sign In' : 'Sign Up'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Session;
