import React from 'react';

import { selectors as selectedCourseSelectors } from './selectedCourseSlice';
import { useSelector } from 'react-redux';

const CourseSummary = () => {
  const { course, courseCreator } = useSelector(selectedCourseSelectors.select);

  return (
    <div>
      <div>{course ? course.displayName : 'No course selected'}</div>
      <div>{courseCreator ? courseCreator.displayName : ''}</div>
    </div>
  );
};

export default CourseSummary;
