import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectors as courseSelectors, actions as courseActions, MODES } from './courseSlice';
import ConfirmationDialog from '../../components/ConfirmationDialog';


const ConfirmDeleteCourseDialog = () => {
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

const ConfirmDeleteItemDialog = () => {
  const dispatch = useDispatch();
  const { deleteItemUI } = useSelector(courseSelectors.select);

  return (
    <ConfirmationDialog
      open={deleteItemUI.mode !== MODES.CLOSED}
      message="Are you sure you want to delete this item from this course?"
      onClose={() => dispatch(courseActions.resetDeleteItemUI())}
      onConfirm={() => dispatch(courseActions.deleteItem())}
    />
  )
};

export { ConfirmDeleteCourseDialog, ConfirmDeleteItemDialog };

