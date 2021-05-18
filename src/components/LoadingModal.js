import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import CircularProgress from '@material-ui/core/CircularProgress';
import { useSelector } from 'react-redux';
import { selectors as appSelectors } from '../features/app/appSlice';

const LoadingModal = () => {
  const { globalIsLoading, globalError } = useSelector(appSelectors.select);

  return (
    <Dialog open={globalIsLoading}>
      <DialogContent>
        <CircularProgress className="loading-indicator" />
      </DialogContent>
    </Dialog>
  );
};

export default LoadingModal;
