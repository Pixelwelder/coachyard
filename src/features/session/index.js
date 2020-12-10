import React from 'react';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';

import './session.scss';
import { selectors as sessionSelectors } from './sessionSlice';
import { useSelector } from 'react-redux';

const Session = () => {
  const { isDisplayed } = useSelector(sessionSelectors.select);

  return (
    <Dialog className="session" open={isDisplayed} onClose={() => {}} aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">Delete</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Text
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => {}} color="primary">
          Cancel
        </Button>
        <Button
          onClick={() => {}}
          color="primary"
        >
          Delete!
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Session;
