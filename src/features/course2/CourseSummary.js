import React from 'react';

import { selectors as selectedCourseSelectors } from './selectedCourseSlice';
import { useDispatch, useSelector } from 'react-redux';
import Typography from '@material-ui/core/Typography';
import { actions as selectedCourseActions } from './selectedCourseSlice';
import { useHistory } from 'react-router-dom';

const CourseSummary = () => {
  const { course, courseCreator } = useSelector(selectedCourseSelectors.select);
  const dispatch = useDispatch();
  const history = useHistory();

  const onSelect = () => {
    history.push(`/course/${course.uid}`);
    // dispatch(selectedCourseActions.setSelectedItemUid({ uid: null, history }));
  }

  return (
    <div className="course-summary" onClick={onSelect}>
      <Typography variant="h6" component="h3">
        {course ? course.displayName : 'No course selected'}
      </Typography>
      <Typography variant="body1" component="p">{courseCreator ? courseCreator.displayName : ''}</Typography>
    </div>
  );
};

export default CourseSummary;
