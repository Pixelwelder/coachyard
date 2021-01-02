import React from 'react';
import DialogTitle from '@material-ui/core/DialogTitle';
import SESSION_MODES from '../features/session/sessionModes';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText/DialogContentText';
import TextField from '@material-ui/core/TextField';
import Alert from '@material-ui/lab/Alert';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import { actions as uiActions2, selectors as uiSelectors2 } from '../features/ui/uiSlice2';
import { useDispatch, useSelector } from 'react-redux';
import { actions as appActions } from '../features/app/appSlice';

const isErrorType = type => error => !!error && error.message.toLowerCase().includes(type);

const CreateAccountDialog = () => {
  const { createAccount: actions } = uiActions2;
  const { createAccount: selectors } = uiSelectors2;

  const dispatch = useDispatch();

  const { displayName, email, password, mode, isOpen, isLoading, error } = useSelector(selectors.select);

  const onChange = ({ target }) => {
    const { value } = target;
    const name = target.getAttribute('name');
    dispatch(actions.setValues({ [name]: value }));
  };

  const onToggle = () => {
    dispatch(actions.setValues({
      mode: mode === SESSION_MODES.SIGN_IN ? SESSION_MODES.SIGN_UP : SESSION_MODES.SIGN_IN
    }));
  }

  const onSubmit = (event) => {
    event.preventDefault();
    if (mode === SESSION_MODES.SIGN_UP) {
      dispatch(appActions.signUp({ email, password, displayName }));
    } else if (mode === SESSION_MODES.SIGN_IN) {
      dispatch(appActions.signIn({ email, password }));
    }
  };

  const isDisabled = () => {
    return mode === SESSION_MODES.SIGN_UP
      ? (!displayName || !email || !password || isLoading)
      : (!email || !password || isLoading);
  };

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
        <DialogContentText>
          {mode === SESSION_MODES.SIGN_IN
            ? 'Welcome back!'
            : `Come on in, the water's fine!`
          }
        </DialogContentText>
        <form onSubmit={onSubmit}>
          {mode === SESSION_MODES.SIGN_UP && (
            <TextField
              variant="filled"
              id="displayName" name="displayName" label="Name"
              value={displayName} disabled={isLoading} placeholder="Your Name" autoComplete="name"
              onChange={onChange}
            />
          )}
          <TextField
            variant="filled"
            id="email" name="email" label="Email"
            error={isErrorType('email')(error)}
            value={email} disabled={isLoading} placeholder="youremail@gmail.com" autoComplete="email"
            onChange={onChange}
          />
          <TextField
            variant="filled"
            id="password" name="password" label="Password" type="password" autoComplete="current-password"
            value={password} disabled={isLoading} placeholder="********"
            onChange={onChange}
            error={isErrorType('password')(error)}
          />
        </form>
        {!!error && <Alert severity="error">{error.message}</Alert>}
        {mode === SESSION_MODES.SIGN_IN
          ? (<p>Need an account? <span className="link" onClick={onToggle}>Sign Up</span></p>)
          : (<p>Already got an account? <span className="link" onClick={onToggle}>Sign In</span></p>)
        }
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onSubmit}
          color="primary"
          disabled={isDisabled()}
        >
          {mode === SESSION_MODES.SIGN_IN ? 'Sign In' : 'Sign Up'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateAccountDialog;
