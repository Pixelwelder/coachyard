import React, { useState } from 'react';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText/DialogContentText';
import Alert from '@material-ui/lab/Alert';
import DialogActions from '@material-ui/core/DialogActions';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { selectors as userSelectors } from '../features/app/userSlice';
import { actions as uiActions2, selectors as uiSelectors2 } from '../features/ui/uiSlice2';
import { actions as catalogActions } from '../features/catalog/catalogSlice';
import Card from '@material-ui/core/Card';
import CardMedia from '@material-ui/core/CardMedia';
import { Typography } from '@material-ui/core';

const ChannelItem = ({ id, isSelected = false, onClick, title }) => {
  let classes = 'channel-item';
  if (isSelected) classes = `${classes} selected`;

  return (
    <Grid item xs={4} className={classes} onClick={onClick}>
      {/*<Typography className="channel-item-title">{title}</Typography>*/}
      <Card variant="outlined" className="channel-item-card">
        <CardMedia image={`/images/creation/channel${id}.png`} className="channel-item-media" />
      </Card>
    </Grid>
  );
};

const NewCourseDialog = () => {
  const { createCourse: selectors } = uiSelectors2;
  const { createCourse: actions } = uiActions2;

  const dispatch = useDispatch();
  const {
    isOpen, isLoading, error, selection
  } = useSelector(selectors.select);
  const history = useHistory();

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
    >
      <DialogTitle id="form-dialog-title">Create Channel</DialogTitle>
      <DialogContent>
        <Grid
          container
          spacing={1}
        >
          {['Single Channel', 'Multi Channel', 'Channel Template'].map((title, index) => (
              <ChannelItem
                id={index}
                key={index}
                isSelected={selection === index}
                onClick={() => onSetSelection(index)}
                title={title}
              />
          ))}
        </Grid>
        <DialogContentText>
          <p className="channel-description">
            {selection === 0 && (<>Create a single channel between you and someone you will personally invite.</>)}
            {selection === 1 && (<>Create a single channel between you and one or more people who will purchase access. Each user will be able to communicate with all the others.</>)}
            {selection === 2 && (<>Create a channel template. Purchasers will unlock their own private one-on-one copies.</>)}
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
