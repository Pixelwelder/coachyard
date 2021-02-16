import { useDispatch, useSelector } from 'react-redux';
import { selectors as selectedCourseSelectors } from './selectedCourseSlice';
import { actions as uiActions2, selectors as uiSelectors2 } from '../ui/uiSlice2';
import React, { useEffect, useState } from 'react';
import { actions as catalogActions, actions as catalogSelectors } from '../catalog/catalogSlice';
import { actions as uiActions } from '../ui/uiSlice';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import Alert from '@material-ui/lab/Alert';
import OwnerControls from '../../components/OwnerControls';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import StudentManager from './StudentManager';

/**
 * This component is similar to ItemView but displays Courses instead of Items.
 */
const CourseView = () => {
  const { course, student: existingStudent, courseCreator } = useSelector(selectedCourseSelectors.select);
  const ownsCourse = useSelector(selectedCourseSelectors.selectOwnsCourse);
  const editCourse = useSelector(uiSelectors2.editCourse.select);
  const dispatch = useDispatch();

  const { displayName, student, description, isEditing } = editCourse;
  const isLoading = false;
  const error = null;

  useEffect(() => {
    return () => {
      dispatch(uiActions2.editCourse.reset());
    }
  }, [])

  const onEdit = () => {
    dispatch(uiActions2.editCourse.setValues({
      isEditing: true,
      displayName: course.displayName,
      description: course.description,
      student: course.student
    }));
  };

  const onCancelEdit = () => {
    dispatch(uiActions2.editCourse.reset());
  }

  const onChange = (data) => {
    dispatch(uiActions2.editCourse.setValues(data));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    await dispatch(catalogSelectors.updateCourse({ uid: course.uid, update: editCourse }));
    // TODO Won't show error.
    dispatch(uiActions2.editCourse.reset());
  };

  const onDelete = async (event) => {
    dispatch(uiActions.openDialog({
      name: 'deleteDialog',
      params: {
        item: course,
        onConfirm: catalogActions.deleteCourse
      }
    }));
  };

  const [tab, setTab] = useState(1);

  return (
    <Paper className="item-mode edit-course-mode" variant="outlined">
      {course && (
        <>
          {
            isEditing
              ? (
                <>
                  <Tabs
                    className="edit-course-tabs"
                    onChange={(event, newValue) => setTab(newValue)}
                    value={tab}
                  >
                    <Tab label="Details" />
                    <Tab label="Access" />
                  </Tabs>
                  {tab === 0 && (
                    <form onSubmit={onSubmit}>
                      <TextField
                        fullWidth
                        autoFocus
                        variant="outlined"
                        label="Course Name" placeholder="Course Name" id="displayName"
                        value={displayName} disabled={isLoading}
                        onChange={({ target: { value } }) => onChange({ displayName: value })}
                      />

                      <TextField
                        fullWidth
                        multiline rows={4}
                        variant="outlined"
                        label="Course Description" placeholder="This is a short description of the course."
                        id="description" value={description} disabled={isLoading}
                        onChange={({ target: { value } }) => onChange({ description: value })}
                      />

                      {/* Can't edit an existing student at the moment. */}
                      {existingStudent
                        ? (
                          <TextField
                            fullWidth disabled
                            variant="outlined" label="Student" placeholder="Student"
                            id="student" type="email" value={`${existingStudent.displayName} (${existingStudent.email})`}
                          />
                        )
                        : (
                          <TextField
                            fullWidth
                            variant="outlined" label="Student" placeholder="Student"
                            id="student" type="email" value={student} disabled={isLoading}
                            onChange={({ target: { value } }) => onChange({ student: value })}
                          />
                        )
                      }
                      {!!error && <Alert severity="error">{error.message}</Alert>}

                      <div className="spacer"/>
                      <OwnerControls onCancel={onCancelEdit} onSubmit={onSubmit} onDelete={onDelete}/>
                    </form>
                  )}

                  {tab === 1 && (
                    <StudentManager />
                  )}
                </>
              )

              : (
                <div className="course-details">
                  <Typography variant="h6" component="h3">{course?.displayName || ''}</Typography>
                  <Typography className="course-student">
                    {
                      !ownsCourse
                        ? `Instructor: ${courseCreator?.displayName || ''}`
                        : existingStudent
                        ? `Student: ${existingStudent.displayName} (${existingStudent.email})`
                        : `Student: ${course?.student || ''}`
                    }
                  </Typography>
                  <Typography className="course-description">{course.description}</Typography>

                  <div className="spacer"/>
                  {ownsCourse && (
                    <div className="owner-controls">
                      <Button onClick={onEdit} variant="contained">
                        Edit
                      </Button>
                    </div>
                  )}
                </div>
              )
          }
        </>
      )}
    </Paper>
  );
};

export default CourseView;
