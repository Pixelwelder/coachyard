import React, { useEffect, useState } from 'react';
import StudentManager from './StudentManager';
import { useDispatch, useSelector } from 'react-redux';
import { Typography } from '@material-ui/core';
import FormLabel from '@material-ui/core/FormLabel';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';
import FormControl from '@material-ui/core/FormControl';
import { actions as selectedCourseActions, selectors as selectedCourseSelectors } from './selectedCourseSlice';
import Button from '@material-ui/core/Button';
import { actions as catalogSelectors } from '../catalog/catalogSlice';

const AccessManager = () => {
  const dispatch = useDispatch();
  const { course, isLoading } = useSelector(selectedCourseSelectors.select);
  const [type, setType] = useState('');

  useEffect(() => {
    setType(course.type);
  }, [course]);

  const onUpdate = async () => {
    // await dispatch(catalogSelectors.updateCourse({ uid: course.uid, update: editCourse }));
    await dispatch(selectedCourseActions.update({ type }));
  }

  if (!course) return null;
  return (
    <div className="access-manager">
      <FormControl component="fieldset" className="access-type">
        <FormLabel component="legend">This course is:</FormLabel>
        <RadioGroup
          row aria-label="type" name="type" value={type} onChange={({ target: { value } } ) => setType(value)}
        >
          <FormControlLabel value="public" control={<Radio />} label="Public" />
          <FormControlLabel value="invite" control={<Radio />} label="Invite-only" />
        </RadioGroup>
        {type !== course.type && (
          <Button size="small" color="secondary" variant="contained" onClick={onUpdate} disabled={isLoading}>
            Update
          </Button>
        )}
      </FormControl>

      <StudentManager />
    </div>
  );
};

export default AccessManager;

