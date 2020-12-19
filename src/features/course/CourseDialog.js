import { useDispatch, useSelector } from 'react-redux';
import { actions as courseActions, MODES, selectors as courseSelectors } from './courseSlice';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText/DialogContentText';
import TextField from '@material-ui/core/TextField';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import React from 'react';

const CourseDialog = () => {
  const { newCourse, newCourseMode } = useSelector(courseSelectors.select);
  const dispatch = useDispatch();

  const onSubmit = (event) => {
    event.preventDefault();
    dispatch(courseActions.createCourse({ update: newCourseMode === MODES.EDIT }));
  };

  return (
    <Dialog
      open={newCourseMode !== MODES.CLOSED}
      onClose={() => dispatch(courseActions.closeCourse())}
      aria-labelledby="form-dialog-title"
    >
      <DialogTitle id="form-dialog-title">{newCourse.displayName || ''}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          What would you like to call this course?
        </DialogContentText>
        <form onSubmit={onSubmit}>
          <TextField
            autoFocus id="displayName" label="name" type="text"
            value={newCourse.displayName}
            onChange={({ target: { value } }) => {
              dispatch(courseActions.setNewCourse({ displayName: value }));
            }}
          />
          <TextField
            id="description" label="description" type="text"
            value={newCourse.description}
            onChange={({ target: { value } }) => {
              dispatch(courseActions.setNewCourse({ description: value }));
            }}
          />
          <button className="invisible" type="submit" />
        </form>
      </DialogContent>
      <DialogActions>
        {/*<Button onClick={() => setShowNewDialog(false)} color="primary">*/}
        {/*  Cancel*/}
        {/*</Button>*/}
        <Button
          onClick={onSubmit}
          color="primary"
        >
          {newCourseMode === MODES.CREATE ? 'Create' : 'Update' }
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CourseDialog;
