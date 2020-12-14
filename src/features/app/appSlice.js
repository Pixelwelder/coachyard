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
import { CALLABLE_FUNCTIONS } from '../../app/callableFunctions';

const initialState = {
  isInitialised: false,
  isLoading: false,
  error: null,
  // Just holds the basics.
  authUser: { uid: null, email: null, displayName: null, claims: null },
  authUserMeta: null
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
      // app.auth().useEmulator('http://localhost:9099/');
      app.functions().useEmulator('localhost', 5001);
    }

    app.auth().onAuthStateChanged(
      async (authUser) => {
        if (authUser) {
          const { uid, email, displayName } = authUser;
          dispatch(logActions.log(createLog(`User logged in: ${email}` )));

          // Get token.
          const { claims } = await authUser.getIdTokenResult(true);
          dispatch(generatedActions.setAuthUser({ uid, email, displayName, claims }));

          // Get meta
          const getUserMeta = app.functions().httpsCallable(CALLABLE_FUNCTIONS.GET_USER_META);
          const userMeta = await getUserMeta();
          console.log('userMeta', userMeta);

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

const signUpServerside = createAsyncThunk(
  'signUpServerside',
  async (args, { dispatch }) => {
    try {
      console.log('creating user serverside...');
      const createUser = app.functions().httpsCallable('createUser');
      const result = await createUser(args);

      const { email, password } = args;
      await app.auth().signInWithEmailAndPassword(email, password);
      console.log('result', result);
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
    setAuthUser: (state, action) => {
      state.authUser = action.payload;
    },
    clearError: (state) => { state.error = initialState.error; }
  },
  extraReducers: {
    [init.fulfilled]: (state) => { state.isInitialized = true; },

    [signIn.pending]: setIsLoading(initialState),
    [signOut.pending]: setIsLoading(initialState),
    [signUpServerside.pending]: setIsLoading(initialState),

    [signIn.rejected]: setError(initialState),
    [signOut.rejected]: setError(initialState),
    [signUpServerside.rejected]: setError(initialState)
  }
});

const select = ({ app }) => app;
const selectors = { select };

const actions = { ...generatedActions, init, signIn, signOut, signUpServerside };

export { actions, selectors };
export default reducer;
