import React from 'react';
import Typography from '@material-ui/core/Typography';
import User from '../user';
import './header.scss';

const Header = () => {
  return (
    <div className="header">
      <div className="title-container">
        <Typography variant="h3">Coachyard</Typography>
      </div>

      <div className="user-container">
        <User />
      </div>
    </div>
  );
};

export default Header;
