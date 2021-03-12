import React from 'react';
import { selectors as dashboardSelectors } from '../dashboardSlice';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Typography from '@material-ui/core/Typography';

const StudentItem = ({ token }) => {
  const { userDisplayName, displayName, courseUid } = token;
  return (
    <div className="student-item">
      <Typography className="student-name">{ userDisplayName }</Typography>
      <Typography className="course-link">
        <Link to={`/course/${courseUid}`}>{displayName}</Link>
      </Typography>
    </div>
  );
};

const Students = () => {
  const tokens = useSelector(dashboardSelectors.selectStudentTokens);

  return (
    <div className="dashboard-page">
      <ul className="student-list">
        {tokens.map((token, index) => <StudentItem token={token} key={index} />)}
      </ul>
    </div>
  );
};

export default Students;
