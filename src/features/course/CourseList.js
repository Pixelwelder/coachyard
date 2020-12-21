import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectors as courseSelectors, actions as courseActions, MODES } from './courseSlice';
import AddIcon from '@material-ui/icons/Add';
import RefreshIcon from '@material-ui/icons/Cached';
import EditIcon from '@material-ui/icons/Edit';
import DoneIcon from '@material-ui/icons/Check';
import Button from '@material-ui/core/Button';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import CourseDialog from './CourseDialog';
import ItemDialog from './ItemDialog';
import CourseView from './CourseView';

const CoursesCreated = () => {
  const dispatch = useDispatch();
  const {
    selectedCourse, selectedCourseData, selectedCourseItems, createdCourses, mode
  } = useSelector(courseSelectors.select);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex' }}>
        <h2>Course List</h2>
        {mode === MODES.VIEW && (
          <Button onClick={() => dispatch(courseActions.setMode(MODES.EDIT))}>
            <EditIcon />
          </Button>
        )}
        {mode === MODES.EDIT && (
          <Button onClick={() => dispatch(courseActions.setMode(MODES.VIEW))}>
            <DoneIcon />
          </Button>
        )}
      </div>

      <div style={{ display: 'flex', flexFlow: 'row nowrap' }}>
        <Select
          labelId="tracks-label"
          id="tracks-select"
          value={selectedCourse}
          onChange={({ target: { value } }) => dispatch(courseActions.setAndLoadSelectedCourse(value))}
        >
          {createdCourses.map((course, index) => {
            return <MenuItem value={course.uid} key={index}>{course.displayName}</MenuItem>;
          })}
        </Select>
        <Button onClick={() => alert('not implemented')}>
          <RefreshIcon />
        </Button>
        {mode === MODES.EDIT && (
          <Button onClick={() => dispatch(courseActions.createNewCourse())}>
            <AddIcon />
          </Button>
        )}
      </div>

      <CourseView course={selectedCourseData} items={selectedCourseItems} />
      <CourseDialog />
      <ItemDialog />
    </div>
  );
};

export { CoursesCreated };
