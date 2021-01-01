import React from 'react';

import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText/DialogContentText';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import { useDispatch, useSelector } from 'react-redux';

import { selectors as courseSelectors, actions as courseActions } from './courseSlice';
import MODES from '../ui/Modes';
import Alert from '@material-ui/lab/Alert';

const GiveCourseDialog = () => {
  const dispatch = useDispatch();
  const { giveCourseUI, error } = useSelector(courseSelectors.select);

  const onSubmit = (event) => {
    event.preventDefault();
    dispatch(courseActions.giveCourse());
  }

  return (
    <Dialog
      open={giveCourseUI.mode !== MODES.CLOSED}
      onClose={() => dispatch(courseActions.resetGiveCourseUI())}
      aria-labelledby="form-dialog-title"
    >
      <DialogTitle>Give Course</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Who are you sending this course to?
        </DialogContentText>
        <form onSubmit={onSubmit}>
          <TextField
            autoFocus id="email" label="email" type="email"
            value={giveCourseUI.email}
            onChange={({ target: { value } }) => {
              dispatch(courseActions.setGiveCourseUI({ email: value }));
            }}
          />
        </form>
        {!!error && <Alert severity="error">{error.message}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onSubmit}
          color="primary"
        >
          Give
        </Button>
      </DialogActions>
    </Dialog>
  )
};

export default GiveCourseDialog;
