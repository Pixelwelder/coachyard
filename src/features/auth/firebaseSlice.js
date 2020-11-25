import { createAsyncThunk, createSelector, createSlice } from "@reduxjs/toolkit";
import firebase from "firebase/app";
import { actions as logActions, createLog } from "../../features/log/logSlice";
import firebaseConfig from "../../__config__/firebase.json";
import { ERROR } from "../log/logTypes";

const initialState = {
  isLoading: false,
  authUser: null
};

const init = createAsyncThunk(
  'init',
  async (_, { dispatch }) => {
    try {
      dispatch(logActions.log(createLog('Initializing firebase...')));
      await firebase.initializeApp(firebaseConfig);
      firebase.app().auth().onAuthStateChanged(
        authUser => {
          if (authUser) {
            const { uid, email } = authUser;
            dispatch(logActions.log(createLog(`User logged in: ${email}` )));
            dispatch(generatedActions.setAuth({ uid, email }));
          } else {
            dispatch(logActions.log(createLog(`User logged out.` )));
            dispatch(generatedActions.setAuth(null));
          }
        }
      );
      dispatch(logActions.log(createLog('Firebase initialized')));
    } catch (error) {
      dispatch(logActions.log(createLog(error.message, ERROR)));
      throw error;
    }

  }
);

const signIn = createAsyncThunk(
  'signIn',
  async ({ email, password }, { dispatch }) => {
    try {
      dispatch(logActions.log(createLog('Attempting sign in...')));
      const result = await firebase.app().auth().signInWithEmailAndPassword(email, password);
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

const { reducer, actions: generatedActions } = createSlice({
  name: 'firebase',
  initialState,
  reducers: {
    setAuth: (state, action) => {
      state.authUser = action.payload;
    }
  },
  extraReducers: {

  }
});

const select = ({ firebase }) => firebase;
const selectors = { select };

const actions = { ...generatedActions, init, signIn, signOut };

export { actions, selectors };
export default reducer;
