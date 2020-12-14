import React, { useState } from 'react';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText/DialogContentText';
import TextField from '@material-ui/core/TextField';
import Alert from '@material-ui/lab/Alert';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import { useDispatch, useSelector } from 'react-redux';

import { selectors as teacherSelectors, actions as teacherActions } from './teacherSlice';

const NewStudentDialog = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const { error, isLoading } = useSelector(teacherSelectors.select);

  const onCreate = async () => {
    await dispatch(teacherActions.createStudent({ email, displayName }));
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">Add New Student</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Add a new student.
        </DialogContentText>
        <form>
          <TextField
            fullWidth autoFocus
            variant="filled" label="Student Name" placeholder="Student Name"
            id="displayName" value={displayName}
            onChange={({ target: { value } }) => setDisplayName(value)}
          />
          <TextField
            fullWidth
            variant="filled" label="Student Email" placeholder="Student Email"
            id="email" value={email}
            onChange={({ target: { value } }) => setEmail(value)}
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
          disabled={!displayName || !email}
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewStudentDialog;
