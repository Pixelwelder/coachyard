import React from 'react';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText/DialogContentText';
import Dialog from '@material-ui/core/Dialog';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import { useDispatch, useSelector } from 'react-redux';
import { selectors as courseSelectors, actions as courseActions, MODES } from './courseSlice';

const ConfirmationDialog = ({ open, message, onClose, onConfirm }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="form-dialog-title"
    >
      <DialogTitle>Confirm</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color="primary"
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  )
};

const ConfirmDeleteDialog = () => {
  const dispatch = useDispatch();
  const { deleteCourseUI } = useSelector(courseSelectors.select);

  return (
    <ConfirmationDialog
      open={deleteCourseUI.mode !== MODES.CLOSED}
      message="Are you sure you want to delete this course?"
      onClose={() => dispatch(courseActions.resetDeleteCourseUI())}
      onConfirm={() => dispatch(courseActions.deleteSelectedCourse())}
    />
  )
};

export { ConfirmDeleteDialog };

