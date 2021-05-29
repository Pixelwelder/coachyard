import React from 'react';
import Button from '@material-ui/core/Button';
import { useHistory } from 'react-router-dom';

const Landing = () => {
  const history = useHistory();

  const onGetStarted = () => {
    history.push('/dashboard');
  };

  return (
    <div className="landing-page" style={{ backgroundImage: `url("/images/landing.jpg")` }}>
      <Button variant="contained" color='primary' size="large" onClick={onGetStarted}>
        Get Started
      </Button>
    </div>
  );
};

export default Landing;
