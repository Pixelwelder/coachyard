import React from 'react';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import { Link } from 'react-router-dom';
import User from './user';

const Header = () => {
  return (
    <Box className="page-title" borderBottom={1} borderColor="lightgray">
      <Box className="page-title-container">
        <Link className="page-title-link" to="/dashboard">
          <Typography variant="h5" className="page-title-text">Coachyard.io</Typography>
        </Link>
      </Box>

      <Box className="page-title-user">
        <User />
      </Box>
    </Box>
  );
};

export default Header;
