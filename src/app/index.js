import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Switch, Route, Link, Redirect } from 'react-router-dom';
import { actions as appActions, selectors as appSelectors } from '../features/app/appSlice';
import CssBaseline from '@material-ui/core/CssBaseline';
import Session from '../features/session';
import Header from '../features/header';
import Footer from '../features/footer';
import Account from '../features/account';
import './app.scss';
import Course from '../features/course';
import Catalog from '../features/catalog';
import CreateCourseDialog from '../components/CreateCourseDialog3';
import CreateItemDialog from '../components/CreateItemDialog';
import DeleteDialog from '../components/DeleteDialog';
import { DeleteCourseDialog, DeleteItemDialog } from '../components/DeleteDialogs';
import CreateAccountDialog from '../components/CreateAccountDialog';
import FirebaseSignIn from '../components/FirebaseSignIn';

const App = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(appActions.init());
  }, [dispatch]);

  const { isInitialized } = useSelector(appSelectors.select);
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
          {/*<Route path="/course/:uid" component={Course} />*/}
          <Route path="/course/:uid/:itemUid?" component={Course} />
          <Route path="/" render={() => <Redirect to="/dashboard" />} />
        </Switch>
      </div>

      {/* Footer. */}
      <div className="footer-container">
        <Footer />
      </div>

      {/* MODALS */}
      {/* Are we logged in? */}
      {/*<Session />*/}

      {/* User account. */}
      {/* TODO FirebaseSignIn always signs out. */}
      {/*<FirebaseSignIn />*/}
      <CreateAccountDialog />
      <Account />

      {/* DIALOGS */}
      <DeleteDialog />

      <CreateCourseDialog />
      <CreateItemDialog />
      <DeleteCourseDialog />
      <DeleteItemDialog />

      {/*<Nav />*/}

      {/*<div className="page-section body">*/}

      {/*</div>*/}



    </div>
  );
};

export default App;
