import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { reset, setValue } from '../../util/reduxUtils';
import { parseUnserializables } from '../../util/firestoreUtils';
import app from 'firebase/app';

const initialState = {
  isSignedIn: false,
  meta: {},
  claims: {}
};

let unsubscribeUser = null;
const init = createAsyncThunk(
  'user/init',
  async (_, { dispatch }) => {
    app.auth().onAuthStateChanged(async (authUser) => {
      if (unsubscribeUser) {
        unsubscribeUser();
        unsubscribeUser = null;
      }

      if (authUser) {
        dispatch(generatedActions.setIsSignedIn(true));

        // Listen to user meta.
        unsubscribeUser = app.firestore().collection('users').doc(authUser.uid)
          .onSnapshot((snapshot) => {
            dispatch(generatedActions.setMeta(
              snapshot.exists ? parseUnserializables(snapshot.data()) : initialState.meta
            ));
          });

        // Grab claims.
        const { claims } = await authUser.getIdTokenResult(true);
        dispatch(generatedActions.setClaims(claims));
      } else {
        dispatch(generatedActions.reset());
      }
    });
  }
);

const signUp = createAsyncThunk(
  'signUp',
  async ({ email, password, displayName }) => {
    const result = await app.auth().createUserWithEmailAndPassword(email, password);
    await result.user.updateProfile({ displayName });
  }
);

const signIn = createAsyncThunk(
  'signIn',
  ({ email, password }) => {
    app.auth().signInWithEmailAndPassword(email, password);
  }
);

const signOut = createAsyncThunk(
  'signOut',
  () => {
    app.auth().signOut();
  }
);

const { actions: generatedActions, reducer } = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setIsSignedIn: setValue('isSignedIn'),
    setMeta: setValue('meta'),
    setClaims: setValue('claims'),
    reset: reset(initialState)
  }
});

const select = ({ user }) => user;
const selectors = { select };

const actions = { ...generatedActions, init, signUp, signIn, signOut };

export { selectors, actions };
export default reducer;
