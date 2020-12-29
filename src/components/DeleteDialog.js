import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';

import { selectors as uiSelectors, actions as uiActions, MODES } from '../features/ui/uiSlice';
import { useDispatch, useSelector } from 'react-redux';

const DeleteDialog = () => {
  const { deleteDialog } = useSelector(uiSelectors.select);
  const { mode, item, onConfirm } = deleteDialog;

  const dispatch = useDispatch();

  const onClose = () => {
    dispatch(uiActions.resetUI('deleteDialog'));
  };

  return (
    <Dialog
      open={mode !== MODES.CLOSED}
      onClose={onClose}
      aria-labelledby="form-dialog-title"
    >
      <DialogTitle>Delete</DialogTitle>
      <DialogContent>
        {mode === MODES.VIEW && (
          <DialogContentText>
            {item && `Are you sure you want to delete "${item.displayName}"?`}
          </DialogContentText>
        )}
        {mode === MODES.PROCESSING && (
          <DialogContentText>
            {item && `Deleting "${item.displayName}" forever...`}
          </DialogContentText>
        )}
      </DialogContent>
        {mode === MODES.VIEW && item && (
          <DialogActions>
            <Button
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              onClick={dispatch(onConfirm(item))}
              color="primary"
            >
              Confirm
            </Button>
          </DialogActions>
        )}
    </Dialog>
  )
};

export default DeleteDialog;
