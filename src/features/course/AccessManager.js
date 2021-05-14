import React, { useEffect, useState } from 'react';
import StudentManager from './StudentManager';
import { useDispatch, useSelector } from 'react-redux';
import FormLabel from '@material-ui/core/FormLabel';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';
import FormControl from '@material-ui/core/FormControl';
import { actions as selectedCourseActions, selectors as selectedCourseSelectors } from './selectedCourseSlice';
import Button from '@material-ui/core/Button';
import { actions as catalogSelectors } from '../catalog/catalogSlice';
import TextField from '@material-ui/core/TextField';
import InputMask from 'react-input-mask';
import Typography from '@material-ui/core/Typography';
import { actions as uiActions2, selectors as uiSelectors2 } from '../ui/uiSlice2';

const AccessManager = () => {
  const editCourse = useSelector(uiSelectors2.editCourse.select);
  const { course, isLoading } = useSelector(selectedCourseSelectors.select);
  const dispatch = useDispatch();
  const { price, type } = editCourse;
  const isPublic = false;

  // useEffect(() => {
  //   dispatch(uiActions2.editCourse.setValues(course));
  // }, [course]);

  const onSave = async () => {
    // await dispatch(catalogSelectors.updateCourse({ uid: course.uid, update: editCourse }));
    // await dispatch(selectedCourseActions.update({ type }));
  };

  const onChange = (data) => {
    dispatch(uiActions2.editCourse.setValues(data));
  };

  const onChangePublic = (value) => {

  }

  if (!course) return null;
  return (
    <div className="access-manager">
      {['public', 'template'].includes(type) && (
        <>
          <p>{type}</p>
          <Typography className="light-text">Is this course open to the public?</Typography>
          <RadioGroup className="vertical-spacer" row aria-label="type" name="public" value={isPublic} onChange={onChange}>
            <FormControlLabel value="true" control={<Radio />} label="Public" />
            <FormControlLabel value="false" control={<Radio />} label="Private" />
          </RadioGroup>
          <Typography className="light-text vertical-spacer">How much does this course cost?</Typography>
          <div className="price-container">
            <Typography className="currency-sign" variant="h6">$</Typography>
            <TextField
              variant="outlined" label="Price" placeholder="49.95"
              id="students" name="students"
              value={price / 100}
              disabled={isLoading}
              inputProps={{
                type: 'number',
                step: '0.01'
              }}
              onChange={({ target: { value } }) => onChange({
                // price: String(value * 1000).replace(/[^0-9.-]+/g,"")
                price: value * 100
              })}
            />
          </div>
        </>
      )}
      <StudentManager />
    </div>
  );
};

export default AccessManager;

