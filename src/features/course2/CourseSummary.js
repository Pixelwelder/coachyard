import React from 'react';

import { selectors as selectedCourseSelectors } from './selectedCourseSlice';
import { useDispatch, useSelector } from 'react-redux';
import Typography from '@material-ui/core/Typography';
import { actions as uiActions } from '../ui/uiSlice';
import { actions as catalogActions } from '../catalog/catalogSlice';
import DeleteIcon from '@material-ui/icons/Delete';
import Button from '@material-ui/core/Button';

const CourseSummary = () => {
  const { course, courseCreator } = useSelector(selectedCourseSelectors.select);
  const dispatch = useDispatch();

  const onDelete = () => {
    console.log('onDelete', course);
    dispatch(uiActions.openDialog({
      name: 'deleteDialog',
      params: {
        item: course,
        onConfirm: catalogActions.deleteCourse
      }
    }));
  }

  return (
    <div className="course-summary">
      <div className="course-info">
        <Typography variant="h6" component="h3">
          {course ? course.displayName : 'No course selected'}
        </Typography>
        <Typography variant="body1" component="p">{courseCreator ? courseCreator.displayName : ''}</Typography>
      </div>
      <Button onClick={onDelete}>
        <DeleteIcon />
      </Button>
    </div>
  );
};

export default CourseSummary;
