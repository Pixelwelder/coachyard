import { useDispatch, useSelector } from 'react-redux';
import { actions as selectedCourseActions, selectors as selectedCourseSelectors } from './selectedCourseSlice';
import { actions as uiActions2, selectors as uiSelectors2 } from '../ui/uiSlice2';
import React, { useEffect } from 'react';
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
import AccessManager from './AccessManager';
import { Link } from 'react-router-dom';

/**
 * This component is similar to ItemView but displays Courses instead of Items.
 */
const CourseView = () => {
  const { course, courseCreator, editMode } = useSelector(selectedCourseSelectors.select);
  const ownsCourse = useSelector(selectedCourseSelectors.selectOwnsCourse);
  const editCourse = useSelector(uiSelectors2.editCourse.select);
  const dispatch = useDispatch();

  const { displayName, description, isEditing } = editCourse;
  const isLoading = false;
  const error = null;

  useEffect(() => {
    return () => {
      dispatch(uiActions2.editCourse.reset());
    }
  }, [dispatch]);

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
                    onChange={(event, newValue) => dispatch(selectedCourseActions.setEditMode(newValue))}
                    value={editMode}
                  >
                    <Tab label="Details" />
                    <Tab label="Access" />
                  </Tabs>

                  {editMode === 0 && (
                    <form className="edit-course-form" onSubmit={onSubmit}>
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
                        multiline rows={10}
                        variant="outlined"
                        label="Course Description" placeholder="This is a short description of the course."
                        id="description" value={description} disabled={isLoading}
                        onChange={({ target: { value } }) => onChange({ description: value })}
                      />

                      <div className="spacer"/>
                    </form>
                  )}

                  {editMode === 1 && (
                    <AccessManager />
                  )}

                  {!!error && <Alert severity="error">{error.message}</Alert>}
                  <OwnerControls onCancel={onCancelEdit} onSubmit={onSubmit} onDelete={onDelete}/>
                </>
              )

              : (
                <div className="course-details">
                  <Typography variant="h5" component="h3">{course?.displayName || ''}</Typography>
                  <Link to={`/${courseCreator?.slug || 'dashboard'}`}>
                    <Typography variant="h6" component="h4">{courseCreator?.displayName || ''}</Typography>
                  </Link>
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
