import React, { useEffect, useState } from 'react';
import MODES from '../features/ui/Modes';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText/DialogContentText';
import TextField from '@material-ui/core/TextField';
import { actions as uiActions } from '../features/ui/uiSlice';
import { actions as catalogActions } from '../features/catalog/catalogSlice';
import { actions as uiActions2, selectors as uiSelectors2 } from '../features/ui/uiSlice2';
import Typography from '@material-ui/core/Typography';
import { DateTimePicker } from '@material-ui/pickers';
import Alert from '@material-ui/lab/Alert';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import { useDispatch, useSelector } from 'react-redux';
import { DateTime } from 'luxon';

const NewCourseDialog = () => {
  const { createCourse: selectors } = uiSelectors2;
  const { createCourse: actions } = uiActions2;

  const [lastMode, setLastMode] = useState(MODES.CLOSED);
  const dispatch = useDispatch();
  const { mode, displayName, student, description, date } = useSelector(selectors.select);
  const isLoading = false;
  const error = null;

  useEffect(() => {
    const go = () => {
      if (mode === MODES.OPEN) {
        // Default to a date/time that's a nice round number in the future.
        // At least an hour away, at the top of the hour.
        const hours = DateTime.local().hour + 2;
        const newDate = DateTime.local().set({ hours, minutes: 0, seconds: 0, milliseconds: 0 }).toUTC().toString();
        dispatch(actions.setValues({ date: newDate }));
      }
    };

    if (mode !== lastMode) {
      go();
      setLastMode(mode);
    }
  }, [mode]);

  const onChange = ({ target }) => {
    const { value } = target;
    const name = target.getAttribute('name');
    dispatch(actions.setValues({ [name]: value }));
  };

  const onChangeDate = (value) => {
    // dispatch(actions.setValues({ date: value }));
  };

  const onClose = () => {
    dispatch(actions.setValues({ mode: MODES.CLOSED }));
  };

  const onSubmit = async () => {
    await dispatch(catalogActions.createNewCourse({
      displayName, student, description, date
    }));
  };

  return (
    <Dialog open={mode !== MODES.CLOSED} onClose={onClose} aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">Create Live Course</DialogTitle>
      <DialogContent>
        <DialogContentText>
          NEW - Create a brand-spankin'-new Live Course.
        </DialogContentText>
        <form onSubmit={onSubmit}>
          <TextField
            fullWidth
            autoFocus
            variant="outlined" label="Course Name" placeholder={'Ex. "First Steps"'}
            id="displayName" name="displayName" value={displayName} disabled={isLoading}
            onChange={onChange}
          />
          <TextField
            fullWidth
            variant="outlined" label="Student Email" placeholder="studentemail@gmail.com"
            id="student" name="student" type="email" value={student} disabled={isLoading}
            onChange={onChange}
          />
          <Typography>When is your first live session?</Typography>
          <DateTimePicker
            value={date}
            onChange={onChangeDate}
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
