import React, { useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { actions as coachActions, selectors as coachSelectors } from './coachSlice';
import { useDispatch, useSelector } from 'react-redux';
import { PublicCatalogList } from '../catalog/CatalogList';
import Alert from '@material-ui/lab/Alert';
import Typography from '@material-ui/core/Typography';

const Coach = () => {
  const history = useHistory();
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { isLoading, error, coach, courses } = useSelector(coachSelectors.select);

  useEffect(() => {
    dispatch(coachActions.load({ slug, history }));
  }, [slug, history, dispatch]);

  if (!coach) return null;
  return (
    <div className="coach-page">
      <Typography variant="h1">{coach.displayName}</Typography>
      {/*TODO*/}
      <Typography style={{ marginBottom: 32 }}>{coach?.description || ''}</Typography>
      {isLoading && <p>Loading...</p>}
      {!!error && <Alert severity="error">{error.message}</Alert>}
      <PublicCatalogList />
      {/*{courses.map((course, index) => {*/}
      {/*  return <p key={index}>{course.displayName}</p>*/}
      {/*})}*/}
    </div>
  );
};

export default Coach;
