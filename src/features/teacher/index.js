import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import CoursesList from './CoursesList';
import { actions as teacherActions, selectors as teacherSelectors } from './teacherSlice';
import { selectors as appSelectors } from '../app/appSlice';
import Students from './Students';
import { InvitesFrom, InvitesTo } from '../invites';

const Teacher = () => {
  const courses = useSelector(teacherSelectors.selectCourses);
  const { authUser } = useSelector(appSelectors.select);
  const dispatch = useDispatch();

  useEffect(() => {
    const go = async () => {
      // dispatch(teacherActions.init());
    };

    if (authUser) go();
  }, [dispatch, authUser]);

  return (
    <div>
      {/*<CoursesList items={courses} onRefresh={() => dispatch(teacherActions.getCreatedCourses())} />*/}
      {/*<h3>Students</h3>*/}
      {/*<Students />*/}

      <h3>Invites from me:</h3>
      <InvitesFrom />

      <h3>Invites to me:</h3>
      <InvitesTo />
    </div>
  )
};

export default Teacher;
