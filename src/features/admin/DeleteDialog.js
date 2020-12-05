import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import React from 'react';

const DeleteDialog = ({ toDelete, onClose, onConfirm }) => {
  return (
    <Dialog open={!!toDelete} onClose={onClose} aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">Delete</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete '{toDelete}'?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color="primary"
        >
          Delete!
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteDialog;
