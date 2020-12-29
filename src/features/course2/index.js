import React, { useEffect } from 'react';
import Grid from '@material-ui/core/Grid';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { actions as selectedCourseActions, selectors as selectedCourseSelectors } from './selectedCourseSlice';
import { actions as uiActions, MODES, selectors as uiSelectors } from '../ui/uiSlice';

// import { selectors}
import './course.scss';
import ItemList from './ItemList';
import Button from '@material-ui/core/Button';

const Course = () => {
  const { id } = useParams();
  const { course } = useSelector(selectedCourseSelectors.select);
  const { deleteDialog } = useSelector(uiSelectors.select);

  const dispatch = useDispatch();

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
        <Button
          onClick={() => dispatch(uiActions.openDialog({
            name: 'newItemDialog',
            params: { uid: course.uid }
          }))}
        >
          Create New (new item dialog)
        </Button>
      </Grid>
    </Grid>
  );
};

export default Course;
