import React, { useCallback } from 'react';
import Snackbar from '@material-ui/core/Snackbar';
import Alert from '@material-ui/lab/Alert';
import { useDispatch, useSelector } from 'react-redux';
import { selectors as appSelectors, actions as appActions } from '../features/app/appSlice';

const Error = ({ error, onClose }) => (
  <Snackbar
    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    open={!!error}
    autoHideDuration={6000}
  >
    <Alert severity="error" onClose={onClose}>{error?.message}</Alert>
  </Snackbar>
);

const GlobalError = () => {
  const { globalError } = useSelector(appSelectors.select);
  const dispatch = useDispatch();

  const onClose = useCallback((event, reason) => {
    if (reason !== 'clickaway') dispatch(appActions.clearGlobalError());
  }, []);

  return (
    <Error
      error={globalError}
      onClose={onClose}
    />
  );
};

export { Error, GlobalError };
