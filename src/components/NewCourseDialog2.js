import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import React, { useState } from 'react';
import TextField from '@material-ui/core/TextField';
import { useDispatch, useSelector } from 'react-redux';

import { selectors as uiSelectors, actions as uiActions } from '../features/ui/uiSlice';
// import { selectors as teacherSelectors, actions as teacherActions } from '../features/teacher/teacherSlice';
import { actions as catalogActions } from '../features/catalog/catalogSlice';
import Alert from '@material-ui/lab/Alert';

const NewCourseDialog = () => {
  const { newCourseDialog } = useSelector(uiSelectors.select);
  const { isLoading, error, displayName, email, show } = newCourseDialog;
  const dispatch = useDispatch();

  const onClose = () => {
    dispatch(uiActions.resetUI('newCourseDialog'));
    // dispatch(uiActions.setUI({ newCourseDialog: { ...newCourseDialog, show: false } }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    await dispatch(catalogActions.createNewCourse(newCourseDialog));
    onClose();
  };

  return (
    <Dialog open={show} onClose={onClose} aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">Create New Course</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Create a brand-spankin'-new course.
        </DialogContentText>
        <form onSubmit={onSubmit}>
          <TextField
            fullWidth
            variant="filled" label="Course Name" placeholder="Course Name"
            id="displayName" value={displayName} disabled={isLoading}
            onChange={({ target: { value } }) => {
              dispatch(uiActions.setUI({ newCourseDialog: { ...newCourseDialog, displayName: value } }));
            }}
          />
          <TextField
            fullWidth
            variant="filled" label="Student Email" placeholder="Email"
            id="email" type="email" value={email} disabled={isLoading}
            onChange={({ target: { value } }) => {
              dispatch(uiActions.setUI({ newCourseDialog: { ...newCourseDialog, email: value } }));
            }}
          />
        </form>
        {!!error && <Alert severity="error">{error.message}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button
          color="primary"
          disabled={!displayName || isLoading}
          onClick={onSubmit}
        >
          Create!
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewCourseDialog;
