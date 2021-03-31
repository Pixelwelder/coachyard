import React from 'react';
import MODES from '../features/ui/Modes';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import Dialog from '@material-ui/core/Dialog';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import { selectors as uiSelectors2, actions as uiActions2 } from '../features/ui/uiSlice2';
import { selectors as catalogSelectors, actions as catalogActions } from '../features/catalog/catalogSlice';
import { selectors as selectedCourseSelectors } from '../features/course/selectedCourseSlice';
import { useDispatch, useSelector } from 'react-redux';

const DeleteDialog = ({ selector, uiActions, onConfirm }) => {
  const { mode, toDelete } = useSelector(selector);
  const dispatch = useDispatch();

  const onClose = () => {
    dispatch(uiActions.reset());
  };

  const _onConfirm = () => {
    onConfirm(toDelete);
    // TODO TODO TODO Error handling.
    dispatch(uiActions.reset());
  }

  return (
    <Dialog
      open={mode !== MODES.CLOSED}
      onClose={onClose}
      aria-labelledby="form-dialog-title"
    >
      <DialogTitle>Delete</DialogTitle>
      <DialogContent>
        Are you sure you want to delete {toDelete?.displayName || 'this'} and everything associated with it?
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          onClick={_onConfirm}
          color="secondary"
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const DeleteCourseDialog = () => {
  return (
    <DeleteDialog
      selector={uiSelectors2.deleteCourse.select}
      uiActions={uiActions2.deleteCourse}
      onConfirm={() => {
        console.log('confirming...');
      }}
    />
  );
};

const DeleteItemDialog = () => {
  const dispatch = useDispatch();
  const { course } = useSelector(selectedCourseSelectors.select);

  return (
    <DeleteDialog
      selector={uiSelectors2.deleteItem.select}
      uiActions={uiActions2.deleteItem}
      onConfirm={(item) => {
        dispatch(catalogActions.deleteItem({ courseUid: course.uid, itemUid: item.uid }));
      }}
    />
  );
};

export { DeleteItemDialog, DeleteCourseDialog };
