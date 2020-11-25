import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import CssBaseline from '@material-ui/core/CssBaseline';

import Video from './features/videoIframe';
import Log from './features/log';
import './App.scss';
import { actions as appActions } from './features/app/appSlice';
import Auth from './features/auth';
import Typography from '@material-ui/core/Typography';

function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(appActions.init());
  }, [dispatch]);

  return (
    <div className="App">
      <CssBaseline />
      <div className="page-section header">
        <Typography variant="h1">Coachyard</Typography>
        <Auth />
      </div>
      <div className="page-section body">
        <div className="sidebar sidebar-1">
          <Typography variant="h2">Videos</Typography>
        </div>
        <div className="video">
          <h2>Video</h2>
          <Video />
        </div>
        {/*<div className="sidebar sidebar-2">*/}
        {/*  <Log />*/}
        {/*</div>*/}
      </div>

      <div className="page-section footer">
        <ul>
          <li><a href="#">Terms and Conditions</a></li>
          <li><a href="#">Privacy Policy</a></li>
        </ul>
      </div>

    </div>
  );
}

export default App;
