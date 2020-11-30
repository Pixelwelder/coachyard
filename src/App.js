import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CssBaseline from '@material-ui/core/CssBaseline';
import Typography from '@material-ui/core/Typography';

import Video from './features/videoIframe';
import Log from './features/log';
import './App.scss';
import { actions as appActions } from './features/app/appSlice';
import Auth from './features/auth';
import Admin from './features/admin';
import Nav from './features/nav';
import { selectors as navSelectors, TABS } from './features/nav/navSlice';

function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(appActions.init());
  }, [dispatch]);

  const { tab } = useSelector(navSelectors.select);

  return (
    <div className="App">
      <CssBaseline />
      <div className="page-section header">
        <Typography variant="h1">Coachyard</Typography>
        <Auth />
      </div>

      <Nav />

      <div className="page-section body">
        {tab === 0 && (
          <>
            <div className="sidebar sidebar-1">
              <Typography variant="h2">Videos</Typography>
            </div>
            <div className="video">
              <Video />
            </div>
          </>
        )}
        {tab === 1 && (
          <Admin />
        )}
        {tab === 2 && (
          <Log />
        )}
        {/*<div className="sidebar sidebar-2">*/}
        {/*  <Log />*/}
        {/*</div>*/}
      </div>

      <div className="page-section footer">
        <ul>
          <li><a href="/">Terms and Conditions</a></li>
          <li><a href="/">Privacy Policy</a></li>
        </ul>
      </div>

    </div>
  );
}

export default App;
