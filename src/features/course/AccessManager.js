import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { selectors as selectedCourseSelectors } from './selectedCourseSlice';
import StudentManager from './StudentManager';
import { actions as uiActions2, selectors as uiSelectors2 } from '../ui/uiSlice2';

const AccessManager = () => {
  const editCourse = useSelector(uiSelectors2.editCourse.select);
  const { course, isLoading } = useSelector(selectedCourseSelectors.select);
  const dispatch = useDispatch();
  const { price, type, isPublic } = editCourse;

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

  const onChangePublic = ({ target: { value } }) => {
    dispatch(uiActions2.editCourse.setValues({ isPublic: value === 'true' }));
  };

  if (!course) return null;
  return (
    <div className="access-manager">
      <Typography className="light-text">Is this course open to the public?</Typography>
      <RadioGroup
        className="vertical-spacer"
        row
        aria-label="type"
        name="public"
        value={isPublic.toString()}
        onChange={onChangePublic}
      >
        <FormControlLabel value="false" control={<Radio />} label="Private" />
        <FormControlLabel value="true" control={<Radio />} label="Public" />
      </RadioGroup>
      <Typography className="light-text vertical-spacer">How much does this course cost?</Typography>
      <div className="price-container">
        <Typography className="currency-sign" variant="h6">$</Typography>
        <TextField
          variant="outlined"
          label="Price"
          placeholder="49.95"
          id="price"
          name="price"
          value={price / 100}
          disabled={isLoading}
          inputProps={{
            type: 'number',
            step: '1',
          }}
          onChange={({ target: { value } }) => onChange({
            // price: String(value * 1000).replace(/[^0-9.-]+/g,"")
            price: Math.floor(value * 100),
          })}
        />
      </div>
      <StudentManager />
    </div>
  );
};

export default AccessManager;
