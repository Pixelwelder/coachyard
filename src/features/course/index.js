import React, { useEffect } from 'react';
import { CoursesCreated } from './CourseList';
import VideoPlayer from './VideoPlayer';
import { actions as courseActions } from './courseSlice';
import { useDispatch } from 'react-redux';

const Course = () => {
  const dispatch = useDispatch();

  return (
    <div className="course">
      <div className="course-body">
        <CoursesCreated />
        {/*<VideoPlayer />*/}
      </div>
    </div>
  );
};

export default Course;
