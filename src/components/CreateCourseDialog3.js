import React, { useEffect, useState } from 'react';
import MODES from '../features/ui/Modes';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText/DialogContentText';
import TextField from '@material-ui/core/TextField';
import { actions as catalogActions } from '../features/catalog/catalogSlice';
import { actions as uiActions2, selectors as uiSelectors2 } from '../features/ui/uiSlice2';
import Typography from '@material-ui/core/Typography';
import { DateTimePicker } from '@material-ui/pickers';
import Alert from '@material-ui/lab/Alert';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import { useDispatch, useSelector } from 'react-redux';

const NewCourseDialog = () => {
  const { createCourse: selectors } = uiSelectors2;
  const { createCourse: actions } = uiActions2;

  const [lastIsOpen, setLastIsOpen] = useState(MODES.CLOSED);
  const dispatch = useDispatch();
  const { isOpen, displayName, students, description, date, isLoading, error } = useSelector(selectors.select);

  const onChange = ({ target }) => {
    const { value } = target;
    const name = target.getAttribute('name');
    dispatch(actions.setValues({ [name]: value }));
  };

  const onChangeDate = (value) => {
    dispatch(actions.setValues({ date: value.toUTC().toString() }));
  };

  const onClose = () => {
    dispatch(actions.reset());
  };

  const onSubmit = async () => {
    await dispatch(catalogActions.createNewCourse({
      displayName, students, description, date
    }));
  };

  return (
    <Dialog
      open={isOpen} onClose={onClose} aria-labelledby="form-dialog-title" fullWidth
    >
      <DialogTitle id="form-dialog-title">Create Live Course</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Create a brand-spankin'-new Live Course.
        </DialogContentText>
        <form onSubmit={onSubmit} className="create-course-form">
          <TextField
            fullWidth
            autoFocus
            variant="outlined" label="Course Name" placeholder={'Ex. "First Steps"'}
            id="displayName" name="displayName" value={displayName} disabled={isLoading}
            onChange={onChange}
          />
          <TextField
            fullWidth
            variant="outlined" label="Student Email" placeholder="student1@gmail.com, student2@gmail.com, ..."
            id="students" name="students" type="email" value={students} disabled={isLoading}
            onChange={onChange}
          />
          <Typography>When is your first live session?</Typography>
          <DateTimePicker
            value={date}
            onChange={onChangeDate}
            disabled={isLoading}
          />
        </form>
        {!!error && <Alert severity="error">{error.message}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          color="primary"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          color="primary"
          disabled={!displayName || !students || isLoading}
          onClick={onSubmit}
        >
          Create!
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewCourseDialog;
