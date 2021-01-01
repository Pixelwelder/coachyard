import React, { useEffect } from 'react';
import Grid from '@material-ui/core/Grid';
import { useParams, useHistory, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { actions as selectedCourseActions, selectors as selectedCourseSelectors } from './selectedCourseSlice';
import { actions as uiActions, selectors as uiSelectors } from '../ui/uiSlice';
import { selectors as uiSelectors2, actions as uiActions2 } from '../ui/uiSlice2';
import { actions as catalogActions, actions as catalogSelectors } from '../catalog/catalogSlice';
import './course.scss';
import ItemList from './ItemList';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import CourseSummary from './CourseSummary';
import TextField from '@material-ui/core/TextField';
import Alert from '@material-ui/lab/Alert';
import ItemView from './ItemView';
import OwnerControls from '../../components/OwnerControls';

/**
 * This component is similar to ItemView but displays Courses instead of Items.
 */
const CourseView = () => {
  const { course, student: existingStudent } = useSelector(selectedCourseSelectors.select);
  const editCourse = useSelector(uiSelectors2.editCourse.select);
  const dispatch = useDispatch();

  const { displayName, student, description, isEditing } = editCourse;
  const isLoading = false;
  const error = null;

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
                <form onSubmit={onSubmit}>
                  <TextField
                    fullWidth
                    autoFocus
                    variant="filled"
                    label="Course Name" placeholder="Course Name" id="displayName"
                    value={displayName} disabled={isLoading}
                    onChange={({ target: { value } }) => onChange({ displayName: value })}
                  />

                  <TextField
                    fullWidth
                    multiline rows={4}
                    variant="filled"
                    label="Course Description" placeholder="This is a short description of the course."
                    id="description" value={description} disabled={isLoading}
                    onChange={({ target: { value } }) => onChange({ description: value })}
                  />

                  {/* Can't edit an existing student at the moment. */}
                  {existingStudent
                    ? (
                      <TextField
                        fullWidth disabled
                        variant="filled" label="Student" placeholder="Student"
                        id="student" type="email" value={`${existingStudent.displayName} (${existingStudent.email})`}
                      />
                    )
                    : (
                      <TextField
                        fullWidth
                        variant="filled" label="Student" placeholder="Student"
                        id="student" type="email" value={student} disabled={isLoading}
                        onChange={({ target: { value } }) => onChange({ student: value })}
                      />
                    )
                  }
                  {!!error && <Alert severity="error">{error.message}</Alert>}

                  <div className="spacer" />
                  <OwnerControls onCancelEdit={onCancelEdit} onSubmit={onSubmit} onDelete={onDelete} />
                </form>
              )

              : (
                <div className="course-details">
                  <Typography variant="h6" component="h3">{course.displayName}</Typography>
                  <Typography className="course-student">
                    {
                      existingStudent
                        ? `Student: ${existingStudent.displayName} (${existingStudent.email})`
                        : `Student: ${course.student}`
                    }
                  </Typography>
                  <Typography className="course-description">{course.description}</Typography>

                  <div className="spacer" />
                  <div className="owner-controls">
                    <Button onClick={onEdit} variant="contained" color="primary">
                      Edit
                    </Button>
                  </div>
                </div>
              )
          }
        </>
      )}
    </Paper>
  );
};

const Course = () => {
  const { id } = useParams();
  const { course, courseCreator, selectedItem } = useSelector(selectedCourseSelectors.select);
  const ownsCourse = useSelector(selectedCourseSelectors.selectOwnsCourse);
  const history = useHistory();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(selectedCourseActions.setId({ id, history }));
  }, [id]);

  return (
    <div className="app-content">
      <div className="course-header">
        <Typography variant="h6" component="h2">
          <Link to="/dashboard">Courses</Link> > {course?.displayName || ''}
        </Typography>
        <Typography variant="body1">
          {courseCreator?.displayName || ''}
        </Typography>
      </div>
      <Grid
        container
        className="app-content-container"
      >
        <Grid
          item
          xs={12}
          sm={8}
          className="app-content-main"
        >
          {
            selectedItem
            ? <ItemView />
            : <CourseView />
          }
        </Grid>

        <Grid
          item
          xs={12}
          sm={4}
          className="app-content-toc"
        >
          <Paper className="toc-container" variant="outlined">
            <div className="toc-header">
              <CourseSummary />
            </div>
            <ItemList />
            <div className="toc-footer">
              {ownsCourse && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => dispatch(uiActions.openDialog({
                    name: 'newItemDialog',
                    params: {
                      courseUid: course.uid
                    }
                  }))}
                >
                  Create New
                </Button>
              )}
            </div>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default Course;
