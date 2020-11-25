import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import app from 'firebase/app';
import 'firebase/auth';

import firebaseConfig from '../../__config__/firebase.json';
import { actions as logActions } from '../log/logSlice';
import { createLog } from '../log/logSlice';
import { ERROR } from '../log/logTypes';
import firebase from 'firebase';

const initialState = {
  initialized: false,
  isLoading: false,
  authUser: { uid: null, email: null }
};

const init = createAsyncThunk(
  'init',
  async (_, { getState, dispatch }) => {
    dispatch(logActions.log(createLog(`Initializing...` )));
    try {
      await app.initializeApp(firebaseConfig);
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
    } catch (error) {
      dispatch(logActions.log(createLog(error.message, ERROR)));
    }
    dispatch(logActions.log(createLog(`Initialization complete.` )));
  }
);

const signIn = createAsyncThunk(
  'signIn',
  async ({ email, password }, { dispatch }) => {
    try {
      dispatch(logActions.log(createLog('Attempting sign in...')));
      const result = await app.auth().signInWithEmailAndPassword(email, password);
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
      const result = await firebase.app().auth().signOut();
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
