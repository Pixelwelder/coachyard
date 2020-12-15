import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CssBaseline from '@material-ui/core/CssBaseline';
import Typography from '@material-ui/core/Typography';

import Video from './features/videoIframe';
import Log from './features/log';
import './App.scss';
import Auth from './features/auth';
import Admin from './features/admin';
import Nav from './features/nav';
import { selectors as navSelectors, MAIN_TABS } from './features/nav/navSlice';
import { actions as appActions, selectors as appSelectors } from './features/app/appSlice';
import Course from './features/course';
import Session from './features/session';
import Account from './features/account';
import Teacher from './features/teacher';

function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(appActions.init());
  }, [dispatch]);

  const { isInitialized } = useSelector(appSelectors.select);
  const { mainTab } = useSelector(navSelectors.select);
  const { query } = useSelector(appSelectors.select);
  // console.log(query);

  if (!isInitialized) {
    return null;

  }

  return (
    <div className="App">
      {/*<p>{ query.toString() }</p>*/}
      <CssBaseline />
      <Session />
      <Account />
      <div className="page-section header">
        <Typography variant="h1">Coachyard</Typography>
        <Auth />
      </div>

      <Nav />

      <div className="page-section body">
        {mainTab === MAIN_TABS.VIDEO && (
          <>
            <div className="sidebar sidebar-1">
              <Typography variant="h2">Live Session</Typography>
            </div>
            <div className="video">
              <Video />
            </div>
          </>
        )}
        {mainTab === MAIN_TABS.COURSE && (
          <Course />
        )}
        {mainTab === MAIN_TABS.TEACHER && (
          <Teacher />
        )}
        {mainTab === MAIN_TABS.ADMIN && (
          <Admin />
        )}
        {mainTab === MAIN_TABS.DEV && (
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
