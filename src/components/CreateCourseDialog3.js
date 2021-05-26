import React, { useState } from 'react';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText/DialogContentText';
import TextField from '@material-ui/core/TextField';
import Alert from '@material-ui/lab/Alert';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import { useDispatch, useSelector } from 'react-redux';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import { useHistory } from 'react-router-dom';
import { selectors as userSelectors } from '../features/app/userSlice';
import { actions as uiActions2, selectors as uiSelectors2 } from '../features/ui/uiSlice2';
import { actions as catalogActions } from '../features/catalog/catalogSlice';
import MODES from '../features/ui/Modes';

const NewCourseDialog = () => {
  const { createCourse: selectors } = uiSelectors2;
  const { createCourse: actions } = uiActions2;
  const { meta } = useSelector(userSelectors.select);

  const [lastIsOpen, setLastIsOpen] = useState(MODES.CLOSED);
  const dispatch = useDispatch();
  const {
    isOpen, displayName, students, description, date, type, isLoading, error,
  } = useSelector(selectors.select);
  const history = useHistory();

  const onChange = ({ target }) => {
    const { value } = target;
    const name = target.getAttribute('name');
    dispatch(actions.setValues({ [name]: value }));
  };

  const onChangeDate = (value) => {
    dispatch(actions.setValues({ date: value.toUTC().toString() }));
  };

  const onClose = () => {
    dispatch(actions.reset());
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    // TODO This should be in the action.
    const { payload: course } = await dispatch(
      catalogActions.createNewCourse({
        displayName,
        students,
        description,
        type,
        // Don't create a first item on a template.
        date: type === 'template' ? null : date,
      }),
    );

    console.log('created', course);
    dispatch(uiActions2.editCourse.setValues(course));
    dispatch(uiActions2.editCourse.setIsEditing(true));
    history.push(`/course/${course.uid}`);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      aria-labelledby="form-dialog-title"
      fullWidth
    >
      <DialogTitle id="form-dialog-title">Create Live Course</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Create a brand-spankin'-new Live Course.
        </DialogContentText>
        <form onSubmit={onSubmit} className="create-course-form">
          <FormControl>
            <FormLabel control="course-name" label="What is this course called?" />
            <TextField
              id="course-name"
              fullWidth
              autoFocus
              variant="outlined"
              label="Course Name"
              placeholder={'Ex. "First Steps"'}
              id="displayName"
              name="displayName"
              value={displayName}
              disabled={isLoading}
              onChange={onChange}
            />
          </FormControl>
          <FormControl component="fieldset">
            <FormLabel component="legend">This course is:</FormLabel>
            <RadioGroup row aria-label="type" name="type" value={type} onChange={onChange}>
              <FormControlLabel value="template" control={<Radio />} label="One-to-One" />
              <FormControlLabel value="basic" control={<Radio />} label="One-to-Many" />
            </RadioGroup>
            {type === 'basic' && (<div>A one-to-many course allows you to coach as many people as you would like, but all members can see all content--including each other.</div>)}
            {type === 'template' && (<div>A one-to-one course is intended to make a connection between you and a single other person.</div>)}
          </FormControl>
          {/* {(type === 'invite' || type === 'public') && ( */}
          {/*  <FormControl> */}
          {/*    <FormLabel>When is your first live session?</FormLabel> */}
          {/*    { */}
          {/*      date && ( */}
          {/*        <DateTimePicker */}
          {/*          value={date} */}
          {/*          onChange={onChangeDate} */}
          {/*          disabled={isLoading} */}
          {/*        /> */}
          {/*      ) */}
          {/*    } */}
          {/*  </FormControl> */}
          {/* )} */}
          {/* {type === 'invite' && ( */}
          {/*  <FormControl> */}
          {/*    <TextField */}
          {/*      fullWidth */}
          {/*      variant="outlined" label="Who's Invited?" placeholder="student1@gmail.com, student2@gmail.com, ..." */}
          {/*      id="students" name="students" type="email" value={students} disabled={isLoading} */}
          {/*      onChange={onChange} */}
          {/*    /> */}
          {/*  </FormControl> */}
          {/* )} */}
        </form>
        {!!error && <Alert severity="error">{error.message}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          color="primary"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          color="primary"
          disabled={!displayName || isLoading}
          onClick={onSubmit}
        >
          Create!
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewCourseDialog;
