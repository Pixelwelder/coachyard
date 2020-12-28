import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { actions as appActions, selectors as appSelectors } from '../features/app/appSlice';
import { MAIN_TABS, selectors as navSelectors } from '../features/nav/navSlice';
import CssBaseline from '@material-ui/core/CssBaseline';
import Session from '../features/session';
import Header from '../features/header';
import Footer from '../features/footer';
import Nav from '../features/nav';
import Account from '../features/account';
import Grid from '@material-ui/core/Grid';
import './app.scss';

const App = () => {
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
    <div className="app-root">
      {/* Material styling. */}
      <CssBaseline />

      <div className="header-container">
        <Header />
      </div>

      {/* Content. */}
      <div className="content-container">
        <p>Content</p>
      </div>

      {/* Footer. */}
      <div className="footer-container">
        <Footer />
      </div>

      {/*<Session />*/}



      {/*<Nav />*/}

      {/*<div className="page-section body">*/}

      {/*</div>*/}



      {/* Account modal is always available. */}
      {/* <Account /> */}

    </div>
  );
};

export default App;
