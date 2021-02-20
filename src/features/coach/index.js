import React, { useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { actions as coachActions, selectors as coachSelectors } from './coachSlice';
import { useDispatch, useSelector } from 'react-redux';
import { PublicCatalogList } from '../catalog/CatalogList';
import Alert from '@material-ui/lab/Alert';

const Coach = () => {
  const history = useHistory();
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { isLoading, error, coach, courses } = useSelector(coachSelectors.select);

  useEffect(() => {
    dispatch(coachActions.load({ slug, history }));
  }, [slug, history, dispatch]);

  return (
    <div className="coach-page">
      <h1>Coach: {slug}</h1>
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
