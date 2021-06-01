import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Typography from '@material-ui/core/Typography';
import { selectors as dashboardSelectors } from '../dashboardSlice';
import { actions as assetsActions, selectors as assetsSelectors } from '../../assets/assetsSlice';

const StudentItem = ({ tokens }) => {
  const [token] = tokens; // Grab first one for user/image
  const { userDisplayName, user } = token;
  const path = `/avatars/${user}`;
  const { images } = useSelector(assetsSelectors.select);
  const { [path]: imageUrl = '/images/generic-avatar-2.png' } = images;

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(assetsActions.getAsset({ path }));
  }, [path]);

  return (
    <div className="student-item">
      <img src={imageUrl} className="student-item-image" alt="student-item" />
      <Typography className="student-name" variant="h6">{ userDisplayName }</Typography>
      <ul>
        {
          tokens.map(({ courseUid, displayName }) => (
            <li>
              <Typography className="course-link">
                <Link to={`/course/${courseUid}`}>{displayName}</Link>
              </Typography>
            </li>
          ))
        }
      </ul>
    </div>
  );
};

const Students = () => {
  const studentTokens = useSelector(dashboardSelectors.selectStudentTokens);
  console.log('STUDENTS', studentTokens);

  return (
    <div className="dashboard-page">
      <ul className="student-list">
        {studentTokens.map((_tokens, index) => <StudentItem tokens={_tokens} key={index} />)}
      </ul>
    </div>
  );
};

export default Students;
