import React from 'react';
import Modal from '@material-ui/core/Modal';
import Dialog from '@material-ui/core/Dialog'
import DialogContent from '@material-ui/core/DialogContent';
import CircularProgress from '@material-ui/core/CircularProgress';
import { selectors as appSelectors } from '../features/app/appSlice';
import { useSelector } from 'react-redux';

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
