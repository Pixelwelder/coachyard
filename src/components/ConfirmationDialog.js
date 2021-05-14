import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import { selectors as uiSelectors2, actions as uiActions2 } from '../features/ui/uiSlice2';
import { useDispatch, useSelector } from 'react-redux';

const ConfirmationDialog = () => {
  const { confirmAction: selectors } = uiSelectors2;
  const { confirmAction: actions } = uiActions2;

  const { isOpen, message, confirmLabel, cancelLabel, onConfirm } = useSelector(selectors.select);
  const dispatch = useDispatch();

  const onClose = () => {
    dispatch(actions.reset());
  }

  return (
    <Dialog
      open={isOpen}
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
          {cancelLabel}
        </Button>
        <Button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          color="primary"
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
};

export default ConfirmationDialog;
