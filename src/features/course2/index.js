import React, { useEffect } from 'react';
import Grid from '@material-ui/core/Grid';
import { useParams, useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { actions as selectedCourseActions, selectors as selectedCourseSelectors } from './selectedCourseSlice';
import { actions as uiActions, MODES, selectors as uiSelectors } from '../ui/uiSlice';

// import { selectors}
import './course.scss';
import ItemList from './ItemList';
import Button from '@material-ui/core/Button';
import ItemView from './ItemView';
import CardContent from '@material-ui/core/CardContent';
import Paper from '@material-ui/core/Paper';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';

const Course = () => {
  const { id } = useParams();
  const { course } = useSelector(selectedCourseSelectors.select);
  const selectedItem = useSelector(selectedCourseSelectors.selectSelectedItem);
  const { deleteDialog } = useSelector(uiSelectors.select);
  const history = useHistory();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(selectedCourseActions.setId({ id, history }));
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
        <ItemView item={selectedItem} />
      </Grid>

      <Grid
        item
        xs={12}
        sm={4}
        className="app-content-toc"
      >
        <Paper className="toc-container" variant="outlined">
          <div className="toc-header">
          {course && (
            <p onClick={() => dispatch(selectedCourseActions.setSelectedItemUid(null))}>
              {course.displayName}
            </p>
          )}
          </div>
          <ItemList />
          <div className="toc-footer">
            <Button
              onClick={() => dispatch(uiActions.openDialog({
                name: 'newItemDialog',
                params: {
                  courseUid: course.uid
                }
              }))}
            >
              Create New
            </Button>
          </div>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Course;
