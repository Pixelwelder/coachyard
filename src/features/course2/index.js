import React, { useEffect } from 'react';
import Grid from '@material-ui/core/Grid';
import { Link, useHistory, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { actions as selectedCourseActions, selectors as selectedCourseSelectors } from './selectedCourseSlice';
import { actions as uiActions2 } from '../ui/uiSlice2';
import './course.scss';
import ItemList from './ItemList';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import CourseSummary from './CourseSummary';
import ItemView from './ItemView';
import CourseView from './CourseView';

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
                  onClick={() => dispatch(uiActions2.createItem.open())}
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
