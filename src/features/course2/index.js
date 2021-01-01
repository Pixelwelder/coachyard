import React, { useEffect } from 'react';
import Grid from '@material-ui/core/Grid';
import { useParams, useHistory, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { actions as selectedCourseActions, selectors as selectedCourseSelectors } from './selectedCourseSlice';
import { actions as uiActions } from '../ui/uiSlice';

import './course.scss';
import ItemList from './ItemList';
import Button from '@material-ui/core/Button';
import ItemView from './ItemView';
import Paper from '@material-ui/core/Paper';
import { Typography } from '@material-ui/core';
import CourseSummary from './CourseSummary';

const Course = () => {
  const { id } = useParams();
  const { course, courseCreator } = useSelector(selectedCourseSelectors.select);
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
          <ItemView />
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
