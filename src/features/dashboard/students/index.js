import React, { useEffect } from 'react';
import { selectors as dashboardSelectors } from '../dashboardSlice';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Typography from '@material-ui/core/Typography';
import { actions as assetsActions, selectors as assetsSelectors } from '../../assets/assetsSlice';

const StudentItem = ({ tokens }) => {
  console.log('student item', tokens);
  const [token] = tokens; // Grab first one for user/image
  const { userDisplayName, user } = token;
  const path = `/avatars/${user}.png`;
  const { [path]: imageUrl } = useSelector(assetsSelectors.select);

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(assetsActions.getAsset({ path }));
  }, [path]);

  return (
    <div className="student-item">
      <img src={imageUrl} className="student-item-image" />
      <Typography className="student-name" variant="h6">{ userDisplayName }</Typography>
      <ul>
        {
          tokens.map(({ courseUid, displayName }, index) => (
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
  const tokens = useSelector(dashboardSelectors.selectStudentTokens);

  return (
    <div className="dashboard-page">
      <ul className="student-list">
        {tokens.map((tokens, index) => <StudentItem tokens={tokens} key={index} />)}
      </ul>
    </div>
  );
};

export default Students;
