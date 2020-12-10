import React, { useState } from 'react';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import Link from '@material-ui/core/Link';
import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import { Typography } from '@material-ui/core';
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
  const { isLoading, error, authUser } = useSelector(appSelectors.select);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onClear = () => {
    setEmail('');
    setPassword('');
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    switch (mode) {
      case SESSION_MODES.SIGN_UP: {
        await dispatch(appActions.signUp({ email, password }));
        onClear();
        break;
      }

      case SESSION_MODES.SIGN_IN: {
        await dispatch(appActions.signIn({ email, password }));
        onClear();
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

  return (
    <Dialog className="session" open={!authUser.uid} aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">{mode === SESSION_MODES.SIGN_IN ? 'Sign In' : 'Sign Up'}</DialogTitle>
      <DialogContent>
        {mode === SESSION_MODES.SIGN_UP && (
          <>
            <form onSubmit={onSubmit}>
              <FormControl>
                <Input
                  error={isErrorType('email')(error)}
                  id="email" value={email} disabled={isLoading} placeholder="email"
                  onChange={({ target: { value } }) => setEmail(value)}
                />
              </FormControl>
              <FormControl>
                <Input
                  id="password" type="password" value={password} disabled={isLoading} placeholder="password"
                  onChange={({ target: { value }}) => setPassword(value)}
                  error={isErrorType('password')(error)}
                />
              </FormControl>
              <button className="invisible" type="submit" />
            </form>
            {!!error && <Alert severity="error">{error.message}</Alert>}
            <p>Already got an account? <span className="link" onClick={onToggle}>Sign In</span></p>
          </>
        )}

        {mode === SESSION_MODES.SIGN_IN && (
          <>
            <form onSubmit={onSubmit}>
              <FormControl>
                <Input
                  error={isErrorType('email')(error)}
                  id="email" value={email} disabled={isLoading} placeholder="email"
                  onChange={({ target: { value } }) => setEmail(value)}
                />
              </FormControl>
              <FormControl>
                <Input
                  error={isErrorType('password')(error)}
                  id="password" type="password" value={password} disabled={isLoading} placeholder="password"
                  onChange={({ target: { value }}) => setPassword(value)}
                />
              </FormControl>
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
        >
          {mode === SESSION_MODES.SIGN_IN ? 'Sign In' : 'Sign Up'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Session;
