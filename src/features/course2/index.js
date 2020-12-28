import React, { useEffect } from 'react';
import Grid from '@material-ui/core/Grid';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { actions as selectedCourseActions, selectors as selectedCourseSelectors } from './selectedCourseSlice';

// import { selectors}
import './course.scss';

const Course = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const selectedCourse = useSelector(selectedCourseSelectors.selectSelectedCourse);
  console.log('SELECTED', selectedCourse);

  useEffect(() => {
    dispatch(selectedCourseActions.setId(id));
  }, [id]);

  return (
    <Grid
      container
      className="app-content"
    >
      <Grid
        item
        xs={12}
        sm={8}
        className="app-content-main"
      >
        {selectedCourse && <p>Loaded</p>}
      </Grid>

      <Grid
        item
        xs={12}
        sm={4}
        className="app-content-toc"
      >
        {selectedCourse && <p>{selectedCourse.displayName}</p>}
      </Grid>
    </Grid>
  );
};

export default Course;
