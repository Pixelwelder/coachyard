import React, { useEffect } from 'react';
import Grid from '@material-ui/core/Grid';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { actions as selectedCourseActions, selectors as selectedCourseSelectors } from './selectedCourseSlice';

// import { selectors}
import './course.scss';
import ItemList from './ItemList';

const Course = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { course } = useSelector(selectedCourseSelectors.select);
  // const selectedCourseItems =
  console.log('SELECTED', course);

  useEffect(() => {
    dispatch(selectedCourseActions.setId({ id }));
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
        {course && <p>Loaded</p>}
      </Grid>

      <Grid
        item
        xs={12}
        sm={4}
        className="app-content-toc"
      >
        {course && <p>{course.displayName}</p>}
        <ItemList />
      </Grid>
    </Grid>
  );
};

export default Course;
