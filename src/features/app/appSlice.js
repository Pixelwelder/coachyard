import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import app from 'firebase/app';
import 'firebase/auth';
import 'firebase/functions';

import firebaseConfig from '../../__config__/firebase.json';
import { actions as logActions } from '../log/logSlice';
import { createLog } from '../log/logSlice';
import { actions as adminActions } from '../admin/adminSlice';
import { ERROR } from '../log/logTypes';

const initialState = {
  initialized: false,
  isLoading: false,
  authUser: { uid: null, email: null }
};

const setupFirebase = createAsyncThunk(
  'setupFirebase',
  async (_, { dispatch, getState }) => {
    dispatch(logActions.log(createLog(`Initializing Firebase...` )));
    const state = getState();
    const { initialized } = select(state);
    if (initialized) {
      throw new Error('Firebase is already initialized.');
    }

    await app.initializeApp(firebaseConfig);
    if (window.location.hostname === 'localhost') {
      app.functions().useEmulator('localhost', 5001);
    }

    app.auth().onAuthStateChanged(
      authUser => {
        if (authUser) {
          const { uid, email } = authUser;
          dispatch(logActions.log(createLog(`User logged in: ${email}` )));
          dispatch(appSlice.actions.setAuthUser({ uid, email }));
        } else {
          dispatch(logActions.log(createLog(`User logged out.` )));
          dispatch(appSlice.actions.setAuthUser(initialState.authUser));
        }
      }
    );
    dispatch(logActions.log(createLog(`Firebase initialized` )));
  }
);

const init = createAsyncThunk(
  'initApp',
  async (_, { getState, dispatch }) => {
    dispatch(logActions.log(createLog(`INITIALIZING...` )));
    try {
      await dispatch(setupFirebase());
      await dispatch(adminActions.init({ firebase: app }));
    } catch (error) {
      dispatch(logActions.log(createLog(error.message, ERROR)));
      throw error;
    }
    dispatch(logActions.log(createLog(`INITIALIZATION COMPLETE` )));
  }
);

const signIn = createAsyncThunk(
  'signIn',
  async ({ email, password }, { dispatch }) => {
    try {
      dispatch(logActions.log(createLog('Attempting sign in...')));
      await app.auth().signInWithEmailAndPassword(email, password);
      dispatch(logActions.log(createLog('Sign in successful.')));
    } catch (error) {
      dispatch(logActions.log(createLog(`Firebase error: ${error.message}`, ERROR)));
      throw error;
    }
  }
);

const signOut = createAsyncThunk(
  'signOut',
  async (_, { dispatch }) => {
    try {
      dispatch(logActions.log(createLog('Attempting sign out...')));
      const result = await app.auth().signOut();
      console.log(result);
      dispatch(logActions.log(createLog('Sign out successful.')));
    } catch (error) {
      dispatch(logActions.log(createLog(`Firebase error: ${error.message}`, ERROR)));
      throw error;
    }
  }
);

const appSlice = createSlice({
  name: 'init',
  initialState,
  reducers: {
    setAuthUser: (state, action) => {
      state.authUser = action.payload;
    }
  },
  extraReducers: {
    [init.fulfilled]: (state) => {
      state.initialized = true;
    }
  }
});

const select = ({ app }) => app;
const selectors = { select };

const actions = { init, signIn, signOut };
const reducer = appSlice.reducer;

export { actions, selectors };
export default reducer;
