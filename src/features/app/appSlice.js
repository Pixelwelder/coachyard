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
import { CALLABLE_FUNCTIONS } from '../../app/callableFunctions';
import { parseUnserializables } from '../../util/firestoreUtils';
import { setValue } from '../../util/reduxUtils';

const initialState = {
  isInitialised: false,
  isLoading: false, // TODO
  error: null,
  signInAttempted: false,
  // Just holds the basics.
  authUser: { uid: null, email: null, displayName: null, claims: null, meta: null },
  query: {}
};

const refreshUser = createAsyncThunk(
  'refreshUser',
  async ({ authUser }, { dispatch }) => {
    try {
      console.log('refreshing user', authUser);
      const { uid, email, displayName } = authUser;

      // Get token. TODO
      // const { claims } = await authUser.getIdTokenResult(true);
      const claims = {};

      console.log('claims', claims);

      // Get meta
      const { data } = await app.functions().httpsCallable(CALLABLE_FUNCTIONS.GET_USER)();
      const meta = parseUnserializables(data);
      console.log('userMeta', meta);

      // return { uid, email, displayName, claims, meta };
      dispatch(generatedActions.setAuthUser({ uid, email, displayName, claims, meta }));

      // Load courses.
      // await dispatch(courseActions._getCreatedCourses());
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
);

const setupFirebase = createAsyncThunk(
  'setupFirebase',
  async (_, { dispatch, getState }) => {
    console.log('Initialize Firebase...');
    const state = getState();
    const { isInitialized } = select(state);
    if (isInitialized) {
      throw new Error('Firebase is already initialized.');
    }

    await app.initializeApp(firebaseConfig);
    if (window.location.hostname === 'localhost') {
      app.auth().useEmulator('http://localhost:9099/');
      app.functions().useEmulator('localhost', 5001);
      app.firestore().useEmulator('localhost', 8080);
    }

    app.auth().onAuthStateChanged(
      async (authUser) => {
        dispatch({ type: 'auth/stateChanged', payload: authUser });
        dispatch(generatedActions.setSignInAttempted(true));
        console.log('auth state changed', authUser);
        if (authUser) {
          setTimeout(() => {
            dispatch(refreshUser({ authUser }));
          }, 1000)
          // dispatch(refreshUser({ authUser }));
          // dispatch(generatedActions.setAuthUser({ uid, email, displayName, claims, meta }));

        } else {
          dispatch(generatedActions.setAuthUser(initialState.authUser));
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
      await dispatch(billingActions.init());
      await dispatch(catalogActions.init());
      await dispatch(selectedCourseActions.init());

      // await dispatch(adminActions.init({ firebase: app }));

      // Set the query. For some reason the object returned from queryString is non-serializable.
      const query = queryString.parse(window.location.search);
      const queryObj = Object.entries(query)
        .reduce((accum, [name, val]) => ({ ...accum, [name]: val}), {});
      dispatch(generatedActions.setQuery(queryObj));

      // Do we have an invitation to deal with?
      if (queryObj.invite) {
        console.log('INVITE', queryObj.invite);
      }
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
      const result = await app.auth().signOut();
      console.log(result);
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
      // const result = await createUser(args);

      // const { email, password } = args;
      // await app.auth().signInWithEmailAndPassword(email, password);
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
    setAuthUser: (state, action) => { state.authUser = action.payload; },
    clearError: (state) => { state.error = initialState.error; },
    setQuery: (state, action) => { state.query = action.payload; },
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
/**
 * Selects students as an array ready for a datagrid (i.e. with an id property).
 */
const selectStudents = createSelector(select, ({ authUser }) => {
  const arr = authUser?.meta?.students || [];
  const students = arr.map(item => ({ ...item, id: item.email }));
  return students;
});

const selectCoursesEnrolled = createSelector(select, ({ authUser }) => {
  return authUser?.meta?.coursesEnrolled || [];
});

const selectors = { select, selectStudents, selectCoursesEnrolled };

const actions = { ...generatedActions, init, signIn, signOut, signUp, refreshUser };

export { actions, selectors };
export default reducer;
