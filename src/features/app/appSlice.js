import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import app from 'firebase/app';
import 'firebase/auth';
import 'firebase/functions';
import 'firebase/storage';
import 'firebase/firestore';
import 'firebase/analytics';
import queryString from 'query-string';

import { firebase as firebaseConfig } from '../../config';
import { actions as catalogActions } from '../catalog/catalogSlice';
import { actions as selectedCourseActions } from '../course/selectedCourseSlice';
import { actions as userActions } from './userSlice';
import { actions as billingActions2 } from '../billing2/billingSlice2';
import { actions as scheduleActions } from '../schedule/scheduleSlice';
import { actions as dashboardActions } from '../dashboard/dashboardSlice';
import { actions as coachActions } from '../coach/coachSlice';
import {
  isFulfilledAction,
  isPendingAction,
  isRejectedAction,
  isThisAction,
  resetValue,
  setValue,
} from '../../util/reduxUtils';
import { EventTypes } from '../../constants/analytics';

const name = 'app';
const initialState = {
  isInitialized: false,
  isLoading: false, // TODO
  error: null,
  globalLoadingLevels: 0, // For nested async.
  globalIsLoading: false,
  globalError: null,
  signInAttempted: false,
  query: {},
};

const _init = createAsyncThunk(
  `${name}/_init`,
  async (_, { getState }) => {
    const { isInitialized } = select(getState());
    if (isInitialized) throw new Error('Firebase is already initialized.');

    await app.initializeApp(firebaseConfig);
    if (window.location.hostname === 'localhost') {
      app.auth().useEmulator('http://localhost:9099/');
      app.functions().useEmulator('localhost', 5001);
      app.firestore().useEmulator('localhost', 8082);
    }

    app.analytics();
    app.analytics().setAnalyticsCollectionEnabled(true);
    app.analytics().logEvent(EventTypes.STARTUP);
  },
);

const setupFirebase = createAsyncThunk(
  `${name}/setupFirebase`,
  async (_, { dispatch, getState }) => {
    await dispatch(_init());

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
      },
    );
  },
);

const init = createAsyncThunk(
  `${name}/init`,
  async (_, { getState, dispatch }) => {
    try {
      await dispatch(setupFirebase());
      await dispatch(userActions.init());
      await dispatch(billingActions2.init());
      await dispatch(catalogActions.init());
      await dispatch(selectedCourseActions.init());
      await dispatch(scheduleActions.init());
      await dispatch(dashboardActions.init());
      await dispatch(coachActions.init());

      // Set the query. For some reason the object returned from queryString is non-serializable.
      const query = queryString.parse(window.location.search);
      const queryObj = Object.entries(query)
        .reduce((accum, [name, val]) => ({ ...accum, [name]: val }), {});
      dispatch(generatedActions.setQuery(queryObj));
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
);

const { reducer, actions: generatedActions } = createSlice({
  name,
  initialState,
  reducers: {
    clearError: resetValue('error', initialState.error),
    clearGlobalError: resetValue('globalError', initialState.globalError),
    setQuery: setValue('query'),
    setSignInAttempted: setValue('signInAttempted'),
  },
  extraReducers: builder => builder
    .addMatcher(isPendingAction, (state, action) => {
      state.globalIsLoading = true;
      state.globalError = null;
      state.globalLoadingLevels++;
      if (isThisAction(name)) {
        state.isLoading = true;
        state.error = null;
      }
    })
    .addMatcher(isRejectedAction, (state, action) => {
      state.globalError = action.error;
      state.globalLoadingLevels--;
      if (!state.globalLoadingLevels) state.globalIsLoading = false;
      if (isThisAction(name)) {
        state.isLoading = false;
        state.error = action.error;
      }
    })
    .addMatcher(isFulfilledAction, (state, action) => {
      state.globalError = null;
      state.globalLoadingLevels--;
      if (!state.globalLoadingLevels) state.globalIsLoading = false;
      if (isThisAction(name)) {
        state.isLoading = false;
        state.error = null;

        if (action.type === init.fulfilled.toString()) state.isInitialized = true;
      }
    }),
});

const select = ({ app }) => app;
const selectors = { select };

const actions = { ...generatedActions, init };

export { actions, selectors };
export default reducer;
