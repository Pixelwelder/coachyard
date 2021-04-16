import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Switch, Route, Link, Redirect } from 'react-router-dom';
import { actions as appActions, selectors as appSelectors } from '../features/app/appSlice';
import CssBaseline from '@material-ui/core/CssBaseline';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Account from '../features/account';
import './app.scss';
import Course from '../features/course';
import CreateCourseDialog from '../components/CreateCourseDialog3';
import CreateItemDialog from '../components/CreateItemDialog';
import DeleteDialog from '../components/DeleteDialog';
import { DeleteCourseDialog, DeleteItemDialog } from '../components/DeleteDialogs';
import Barebones from '../features/barebones';
import Billing from '../features/billing2';
import Coach from '../features/coach';
import Dashboard from '../features/dashboard';
import FirebaseSignIn from '../components/FirebaseSignIn';
import { GlobalError } from './Error';
import LoadingModal from '../components/LoadingModal';
import UnlockDialog from '../features/billing2/UnlockDialog';

const App = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(appActions.init());
  }, [dispatch]);

  useEffect(() => {
    const handler = (event) => {
      // console.log('??', event.data);
    }
    window.addEventListener('message', handler, false);
  }, [])

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
          <Route path="/dashboard" component={Dashboard} />
          {/*<Route path="/course/:uid" component={Course} />*/}
          <Route path="/course/:courseUid/:itemUid?" component={Course} />
          <Route path="/barebones" component={Barebones} />
          <Route path="/billing" component={Billing} />
          <Route path="/coach/:slug" component={Coach} />
          <Route path="/" render={() => <Redirect to="/dashboard" />} />
        </Switch>
      </div>

      {/* Footer. */}
      <Footer />

      {/* MODALS */}
      {/* Are we logged in? */}

      {/* User account. */}
      {/* TODO FirebaseSignIn always signs out. */}
      <FirebaseSignIn />
      {/*<CreateAccountDialog />*/}
      <Account />

      {/* DIALOGS */}
      <DeleteDialog />
      <CreateCourseDialog />
      <CreateItemDialog />
      <DeleteCourseDialog />
      <DeleteItemDialog />
      <GlobalError />
      <LoadingModal />
      <UnlockDialog />

      {/*<Iframe*/}
      {/*  id="schedule"*/}
      {/*  url="http://localhost:8000/index.php/user/login"*/}
      {/*  width="800px"*/}
      {/*  height="900px"*/}
      {/*  display="block"*/}
      {/*  position="absolute"*/}
      {/*  style={{ width: '900px', height: '50px', zIndex: 10 }}*/}
      {/*/>*/}

      {/*<iframe*/}
      {/*  style={{ position: 'absolute', height: '100%', border: 'none' }}*/}
      {/*  url="http://localhost:8000/index.php/appointments"*/}
      {/*/>*/}

      {/*<Nav />*/}

      {/*<div className="page-section body">*/}

      {/*</div>*/}



    </div>
  );
};

export default App;
