import React from 'react';
import Typography from '@material-ui/core/Typography';
import Auth from '../auth';

const Header = () => {
  return (
    <div>
      <Typography variant="h1">Coachyard</Typography>
      <Auth />
    </div>
  );
};

export default Header;
