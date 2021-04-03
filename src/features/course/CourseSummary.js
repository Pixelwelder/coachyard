import React from 'react';
import Chip from '@material-ui/core/Chip';
import { selectors as selectedCourseSelectors } from './selectedCourseSlice';
import { useDispatch, useSelector } from 'react-redux';
import Typography from '@material-ui/core/Typography';
import { useHistory } from 'react-router-dom';

const CourseSummary = () => {
  const { course, courseCreator, isRecording } = useSelector(selectedCourseSelectors.select);
  const isCreator = useSelector(selectedCourseSelectors.selectIsCreator);
  const history = useHistory();

  const onSelect = () => {
    if (isRecording) {
      alert('Please stop the recording before navigating away.');
    } else {
      history.push(`/course/${course.uid}`);
    }
  }

  return (
    <div className="course-summary" onClick={onSelect}>
      <Typography variant="h6" component="h3">
        {course ? course.displayName : 'No course selected'}
      </Typography>
      <div className="flex-container">
        <Typography className="creator-name" variant="body1" component="p">
          {courseCreator ? courseCreator.displayName : ''}
        </Typography>
        {isCreator && <Chip label="Creator" color="primary" size="small" />}
      </div>
    </div>
  );
};

export default CourseSummary;
