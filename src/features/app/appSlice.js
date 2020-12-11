import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import app from 'firebase/app';
import 'firebase/auth';
import 'firebase/functions';

import firebaseConfig from '../../__config__/firebase.json';
import { actions as logActions } from '../log/logSlice';
import { createLog } from '../log/logSlice';
import { actions as adminActions } from '../admin/adminSlice';
import { actions as assetActions } from '../../app/assets';
import { ERROR } from '../log/logTypes';

const initialState = {
  isInitialised: false,
  isLoading: false,
  error: null,
  authUser: { uid: null, email: null }
};

const setupFirebase = createAsyncThunk(
  'setupFirebase',
  async (_, { dispatch, getState }) => {
    dispatch(logActions.log(createLog(`Initializing Firebase...` )));
    const state = getState();
    const { isInitialized } = select(state);
    if (isInitialized) {
      throw new Error('Firebase is already initialized.');
    }

    await app.initializeApp(firebaseConfig);
    if (window.location.hostname === 'localhost') {
      app.functions().useEmulator('localhost', 5001);
    }

    app.auth().onAuthStateChanged(
      async (authUser) => {
        if (authUser) {
          const { uid, email } = authUser;
          dispatch(logActions.log(createLog(`User logged in: ${email}` )));

          // Get token.
          const { claims } = await authUser.getIdTokenResult(true);
          dispatch(generatedActions.setAuthUser({ uid, email, claims }));

        } else {
          dispatch(logActions.log(createLog(`User logged out.` )));
          dispatch(generatedActions.setAuthUser(initialState.authUser));
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
      await dispatch(assetActions.init());
      // await dispatch(adminActions.init({ firebase: app }));
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
    console.log('signIn action thunk');
    try {
      dispatch(logActions.log(createLog('Attempting sign in...')));
      await app.auth().signInWithEmailAndPassword(email, password);
      console.log('signed in');
      dispatch(logActions.log(createLog('Sign in successful.')));
    } catch (error) {
      console.log('error', error);
      dispatch(logActions.log(createLog(`Firebase error: ${error.message}`, ERROR)));
      throw error;
    }
  }
);

const signUp = createAsyncThunk(
  'signUp',
  async ({ email, password }, { dispatch }) => {
    try {
      dispatch(logActions.log(createLog('Attempting sign up...')));
      await app.auth().createUserWithEmailAndPassword(email, password);
      dispatch(logActions.log(createLog('Sign up successful')));
    } catch (error) {
      console.log('error', error);
      dispatch(logActions.log(createLog(error.message, ERROR)));
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

/**
 * Used when a load begins or ends.
 */
const setIsLoading = _initialState => (state, action) => {
  state.isLoading = action.payload;
  if (action.payload) state.error = _initialState.error;
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
    setAuthUser: (state, action) => {
      state.authUser = action.payload;
    },
    clearError: (state) => { state.error = initialState.error; }
  },
  extraReducers: {
    [init.fulfilled]: (state) => { state.isInitialized = true; },

    [signIn.pending]: setIsLoading(initialState),
    [signUp.pending]: setIsLoading(initialState),
    [signOut.pending]: setIsLoading(initialState),

    [signIn.rejected]: setError(initialState),
    [signUp.rejected]: setError(initialState),
    [signOut.rejected]: setError(initialState)
  }
});

const select = ({ app }) => app;
const selectors = { select };

const actions = { ...generatedActions, init, signIn, signUp, signOut };

export { actions, selectors };
export default reducer;
