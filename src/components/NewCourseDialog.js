import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import React, { useState } from 'react';
import TextField from '@material-ui/core/TextField';
import { useDispatch, useSelector } from 'react-redux';

import Alert from '@material-ui/lab/Alert';
import { selectors as teacherSelectors, actions as teacherActions } from '../features/teacher/teacherSlice';

const NewCourseDialog = ({ open, onClose }) => {
  const [displayName, setDisplayName] = useState('');
  const { isLoading, error } = useSelector(teacherSelectors.select);
  const dispatch = useDispatch();

  const onCreate = async () => {
    await dispatch(teacherActions.createCourse({ course: { displayName } }));
  };

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">Create New Course</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Create a brand-spankin'-new course.
        </DialogContentText>
        <form>
          <TextField
            fullWidth
            variant="filled"
            label="Channel Name"
            placeholder="Channel Name"
            id="displayName"
            value={displayName}
            disabled={isLoading}
            onChange={({ target: { value } }) => setDisplayName(value)}
          />
        </form>
        {!!error && <Alert severity="error">{error.message}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button
          onClick={onCreate}
          color="primary"
          disabled={!displayName}
        >
          Create!
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewCourseDialog;
