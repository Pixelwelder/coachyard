import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Switch, Route, Link } from 'react-router-dom';
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
import Course from '../features/course2';
import Catalog from '../features/catalog';
import NewCourseDialog from '../components/NewCourseDialog2';
import NewItemDialog from '../components/NewItemDialog';
import DeleteDialog from '../components/DeleteDialog';

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
        <Switch>
          <Route path="/dashboard" component={Catalog} />
          <Route path="/course/:id" component={Course} />
        </Switch>
      </div>

      {/* Footer. */}
      <div className="footer-container">
        <Footer />
      </div>

      {/* MODALS */}
      {/* Are we logged in? */}
      <Session />

      {/* User account. */}
      <Account />

      {/* DIALOGS */}
      <NewCourseDialog />
      <NewItemDialog />
      <DeleteDialog />

      {/*<Nav />*/}

      {/*<div className="page-section body">*/}

      {/*</div>*/}



    </div>
  );
};

export default App;
