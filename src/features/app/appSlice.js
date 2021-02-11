import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import app from 'firebase/app';
import 'firebase/auth';
import 'firebase/functions';
import 'firebase/storage';
import 'firebase/firestore';
import 'firebase/analytics';
import queryString from 'query-string';

import firebaseConfig from '../../__config__/firebase.json';
import { actions as billingActions } from '../billing/billingSlice';
import { actions as catalogActions } from '../catalog/catalogSlice';
import { actions as selectedCourseActions } from '../course/selectedCourseSlice';
import { actions as userActions } from './userSlice';
import { actions as billingActions2 } from '../billing2/billingSlice2';
import { actions as schedulingActions } from '../scheduling/schedulingSlice';
import { resetValue, setValue } from '../../util/reduxUtils';
import { EventTypes } from '../../constants/analytics';

const initialState = {
  isInitialised: false,
  isLoading: false, // TODO
  error: null,
  signInAttempted: false,
  query: {}
};

const _initApp = createAsyncThunk(
  'appInit',
  async (_, { getState }) => {
    const { isInitialized } = select(getState());
    if (isInitialized) throw new Error('Firebase is already initialized.');

    await app.initializeApp(firebaseConfig);
    if (window.location.hostname === 'localhost') {
      app.auth().useEmulator('http://localhost:9099/');
      app.functions().useEmulator('localhost', 5001);
      app.firestore().useEmulator('localhost', 8081);
    }

    app.analytics();
    app.analytics().setAnalyticsCollectionEnabled(true);
    app.analytics().logEvent(EventTypes.STARTUP);
  }
);

const setupFirebase = createAsyncThunk(
  'setupFirebase',
  async (_, { dispatch, getState }) => {
    await dispatch(_initApp());

    app.auth().onAuthStateChanged(
      async (authUser) => {
        dispatch({ type: 'auth/stateChanged', payload: authUser });
        dispatch(generatedActions.setSignInAttempted(true));
        if (authUser) {
          app.analytics().setUserId(authUser.uid);
          app.analytics().logEvent(EventTypes.SIGN_IN);
        } else {
          // app.analytics().logEvent(EventTypes.SIGN_OUT);
        }
      }
    );
  }
);

const init = createAsyncThunk(
  'initApp',
  async (_, { getState, dispatch }) => {
    try {
      await dispatch(setupFirebase());
      await dispatch(userActions.init());
      await dispatch(billingActions2.init());
      await dispatch(catalogActions.init());
      await dispatch(selectedCourseActions.init());
      await dispatch(schedulingActions.init());

      // await dispatch(adminActions.init({ firebase: app }));

      // Set the query. For some reason the object returned from queryString is non-serializable.
      const query = queryString.parse(window.location.search);
      const queryObj = Object.entries(query)
        .reduce((accum, [name, val]) => ({ ...accum, [name]: val}), {});
      dispatch(generatedActions.setQuery(queryObj));
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
);

const { reducer, actions: generatedActions } = createSlice({
  name: 'init',
  initialState,
  reducers: {
    clearError: resetValue('error', initialState.error),
    setQuery: setValue('query'),
    setSignInAttempted: setValue('signInAttempted')
  },
  extraReducers: {
    [init.fulfilled]: (state) => { state.isInitialized = true; }
  }
});

const select = ({ app }) => app;
const selectors = { select };

const actions = { ...generatedActions, init };

export { actions, selectors };
export default reducer;
