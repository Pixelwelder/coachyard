import React, { useState } from 'react';
import MODES from '../features/ui/Modes';
import { actions as uiActions } from '../features/ui/uiSlice';
import { actions as uiActions2, selectors as uiSelectors2 } from '../features/ui/uiSlice2';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText/DialogContentText';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { DateTimePicker } from '@material-ui/pickers';
import Button from '@material-ui/core/Button';
import Alert from '@material-ui/lab/Alert';
import DialogActions from '@material-ui/core/DialogActions';
import Dialog from '@material-ui/core/Dialog';
import { useDispatch, useSelector } from 'react-redux';
import { selectors as selectedCourseSelectors } from '../features/course2/selectedCourseSlice';
import { actions as catalogActions } from '../features/catalog/catalogSlice';

const CreateItemDialog = () => {
  const { createItem: selectors } = uiSelectors2;
  const { createItem: actions } = uiActions2;

  const dispatch = useDispatch();
  const { course } = useSelector(selectedCourseSelectors.select);
  const { displayName, description, date, isLoading, isOpen, error } = useSelector(selectors.select);

  const onCancel = () => {
    dispatch(actions.reset());
  };

  const onChange = ({ target }) => {
    const { value } = target;
    const name = target.getAttribute('name');
    dispatch(actions.setValues({ [name]: value }));
  };

  const onChangeDate = (value) => {
    dispatch(actions.setValues({ date: value.toUTC().toString() }));
  };

  const onSubmit = (event) => {
    event.preventDefault();

    dispatch(catalogActions.createItem({
      courseUid: course.uid,
      item: { displayName, description, date, file: '' }
    }));
  };

  const isDisabled = () => {
    return !displayName || isLoading || !isOpen;
  };

  return (
    <Dialog
      fullWidth
      open={isOpen}
      onClose={onCancel}
      aria-labelledby="form-dialog-title"
    >
      <DialogTitle id="form-dialog-title">
        Create New Live Session
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          {`Schedule a new Live Session.`}
        </DialogContentText>
        <form onSubmit={onSubmit}>
          <TextField
            autoFocus
            id="displayName" name="displayName" label="name" type="text"
            variant="outlined"
            value={displayName}
            onChange={onChange}
          />
          <TextField
            id="description" name="description" label="description" type="text"
            multiline rows={4} variant="outlined"
            value={description}
            onChange={onChange}
          />
          <Typography>When would you like to schedule this session?</Typography>
          <DateTimePicker
            value={date}
            onChange={onChangeDate}
          />
        </form>
        {!!error && <Alert severity="error">{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={isLoading} color="primary">
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          color="primary"
          disabled={isDisabled()}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateItemDialog;
