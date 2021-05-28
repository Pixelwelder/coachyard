import React, { useState } from 'react';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText/DialogContentText';
import TextField from '@material-ui/core/TextField';
import Alert from '@material-ui/lab/Alert';
import DialogActions from '@material-ui/core/DialogActions';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import { useDispatch, useSelector } from 'react-redux';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import { useHistory } from 'react-router-dom';
import { selectors as userSelectors } from '../features/app/userSlice';
import { actions as uiActions2, selectors as uiSelectors2 } from '../features/ui/uiSlice2';
import { actions as catalogActions } from '../features/catalog/catalogSlice';
import MODES from '../features/ui/Modes';
import Paper from '@material-ui/core/Paper';
import Card from '@material-ui/core/Card';
import CardMedia from '@material-ui/core/CardMedia';

const ChannelItem = ({ id, isSelected = false, onClick }) => {
  let classes = 'channel-item';
  if (isSelected) classes = `${classes} selected`;

  return (
    <Grid item xs={4} className={classes} onClick={onClick}>
      <Card variant="outlined" className="channel-item-card">
        <CardMedia image={`/images/creation/channel${id}.png`} className="channel-item-media" />
      </Card>
    </Grid>
  );
};

const NewCourseDialog = () => {
  const { createCourse: selectors } = uiSelectors2;
  const { createCourse: actions } = uiActions2;
  const { meta } = useSelector(userSelectors.select);

  const dispatch = useDispatch();
  const {
    isOpen, displayName, students, description, date, type,
    isLoading, error, selection
  } = useSelector(selectors.select);
  const history = useHistory();

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

  const onSubmit = async (event) => {
    event.preventDefault();
    // TODO This should be in the action.
    const { payload: course } = await dispatch(
      catalogActions.createNewCourse({
        displayName: 'New Channel',
        type: selection === 2 ? 'template' : 'basic'
      }),
    );

    console.log('created', course);
    dispatch(uiActions2.editCourse.setValues(course));
    dispatch(uiActions2.editCourse.setIsEditing(true));
    history.push(`/course/${course.uid}`);
  };

  const onSetSelection = (id) => {
    dispatch(actions.setValues({ selection: id }))
  }

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      aria-labelledby="form-dialog-title"
      // fullWidth
      // maxWidth={'md'}
    >
      <DialogTitle id="form-dialog-title">Create Channel</DialogTitle>
      <DialogContent>
        {/*<DialogContentText>*/}
        {/*  Create a new way for people to reach you and your expertise.*/}
        {/*</DialogContentText>*/}
        <Grid
          container
          spacing={1}
        >
          {[0, 1, 2].map((id) => (
              <ChannelItem id={id} key={id} isSelected={selection === id} onClick={() => onSetSelection(id)} />
          ))}
        </Grid>
        <DialogContentText>
          <p className="channel-description">
            {selection === 0 && (<>Create a single channel between you and someone you will personally invite.</>)}
            {selection === 1 && (<>Create a single channel between you and one or more people who will purchase access.</>)}
            {selection === 2 && (<>Create a channel template. Purchasers will unlock their own one-on-one copies.</>)}
          </p>
        </DialogContentText>
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
          disabled={isLoading}
          onClick={onSubmit}
        >
          Create!
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewCourseDialog;
