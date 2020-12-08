import React, { useEffect } from 'react';
import CourseList from './CourseList';
import VideoPlayer from './VideoPlayer';
import { actions as courseActions } from './courseSlice';
import { useDispatch } from 'react-redux';

const Course = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const go = async () => {
      await dispatch(courseActions.init({ id: 'id-goes-here' })); // TODO
    };
    go();
  }, [dispatch]);

  return (
    <div className="course">
      <div className="course-header">
        <h2>Course</h2>
      </div>
      <div className="course-body">
        <CourseList />
        <VideoPlayer />
      </div>
    </div>
  );
};

export default Course;
