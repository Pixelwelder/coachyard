import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import app from 'firebase/app';
import 'firebase/auth';
import 'firebase/functions';
import 'firebase/storage';
import 'firebase/firestore';
import queryString from 'query-string';

import firebaseConfig from '../../__config__/firebase.json';
import { actions as billingActions } from '../billing/billingSlice';
import { actions as catalogActions } from '../catalog/catalogSlice';
import { actions as selectedCourseActions } from '../course/selectedCourseSlice';
import { actions as userActions } from './userSlice';
import { resetValue, setValue } from '../../util/reduxUtils';

const initialState = {
  isInitialised: false,
  isLoading: false, // TODO
  error: null,
  signInAttempted: false,
  // Just holds the basics.
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
      app.firestore().useEmulator('localhost', 8080);
    }
  }
);

const setupFirebase = createAsyncThunk(
  'setupFirebase',
  async (_, { dispatch, getState }) => {
    await dispatch(_initApp());
    console.log('AFTER');

    app.auth().onAuthStateChanged(
      async (authUser) => {
        dispatch({ type: 'auth/stateChanged', payload: authUser });
        dispatch(generatedActions.setSignInAttempted(true));
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
      await dispatch(billingActions.init());
      await dispatch(catalogActions.init());
      await dispatch(selectedCourseActions.init());

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

const signIn = createAsyncThunk(
  'signIn',
  async ({ email, password }, { dispatch }) => {
    console.log('signIn action thunk');
    try {
      await app.auth().signInWithEmailAndPassword(email, password);
      console.log('signed in');
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }
);

const signOut = createAsyncThunk(
  'signOut',
  async (_, { dispatch }) => {
    try {
      await app.auth().signOut();
    } catch (error) {
      throw error;
    }
  }
);

const signUp = createAsyncThunk(
  'signUp',
  async ({ email, password, displayName }, { dispatch }) => {
    try {
      // const createUser = app.functions().httpsCallable('createUser');
      const result = await app.auth().createUserWithEmailAndPassword(email, password);
      await result.user.updateProfile({ displayName });

      const timestamp = app.firestore.Timestamp.now();
      await app.firestore().collection('users').doc(result.user.uid).set({
        uid: result.user.uid,
        created: timestamp,
        updated: timestamp,
        displayName,
        email,
        enrolled: []
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
);

/**
 * Used when a load begins or ends.
 */
const setIsLoading = _initialState => (state, action) => {
  state.isLoading = action.payload;
  state.error = _initialState.error;
}

/**
 * Used when a load fails.
 */
const setError = _initialState => (state, action) => {
  state.error = action.error || _initialState.error;
  state.isLoading = false;
}

const { reducer, actions: generatedActions } = createSlice({
  name: 'init',
  initialState,
  reducers: {
    clearError: resetValue('error', initialState.error),
    setQuery: setValue('query'),
    setSignInAttempted: setValue('signInAttempted')
  },
  extraReducers: {
    [init.fulfilled]: (state) => { state.isInitialized = true; },

    [signIn.pending]: setIsLoading(initialState),
    [signOut.pending]: setIsLoading(initialState),
    [signUp.pending]: setIsLoading(initialState),

    [signIn.rejected]: setError(initialState),
    [signOut.rejected]: setError(initialState),
    [signUp.rejected]: setError(initialState)
  }
});

const select = ({ app }) => app;
const selectors = { select };

const actions = { ...generatedActions, init, signIn, signOut, signUp };

export { actions, selectors };
export default reducer;
