import React from 'react';

import { selectors as selectedCourseSelectors } from './selectedCourseSlice';
import { useSelector } from 'react-redux';
import Typography from '@material-ui/core/Typography';

const CourseSummary = () => {
  const { course, courseCreator } = useSelector(selectedCourseSelectors.select);

  return (
    <div>
      <Typography variant="h6" component="h3">
        {course ? course.displayName : 'No course selected'}
      </Typography>
      <Typography variant="body1" component="p">{courseCreator ? courseCreator.displayName : ''}</Typography>
    </div>
  );
};

export default CourseSummary;
