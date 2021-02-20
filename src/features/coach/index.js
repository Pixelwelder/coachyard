import React, { useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { actions as coachActions, selectors as coachSelectors } from './coachSlice';
import { useDispatch, useSelector } from 'react-redux';

const Coach = () => {
  const history = useHistory();
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { isLoading, error, coach, courses } = useSelector(coachSelectors.select);

  useEffect(() => {
    dispatch(coachActions.load({ slug, history }));
  }, [slug, history]);

  return (
    <div>
      <h1>Coach: {slug}</h1>
      {isLoading && <p>Loading...</p>}
      {coach && <p>{coach.displayName}</p>}
      {error && (<p>Error: { error.message }</p>)}
      {courses.map((course, index) => {
        return <p key={index}>{course.displayName}</p>
      })}
    </div>
  );
};

export default Coach;
