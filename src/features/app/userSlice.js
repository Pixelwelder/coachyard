import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { reset, setError, setValue } from '../../util/reduxUtils';
import { parseUnserializables } from '../../util/firestoreUtils';
import app from 'firebase/app';

const initialState = {
  isSignedIn: false,
  error: null,
  meta: {},
  claims: {},
  image: ''
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
          .onSnapshot(async (snapshot) => {
            if (snapshot.exists) {
              generatedActions.setMeta(parseUnserializables(snapshot.data()));
              const url = await app.storage().ref(`/avatars/${authUser.uid}.png`).getDownloadURL();
              dispatch(generatedActions.setImage(url));
            } else {
              generatedActions.setMeta(initialState.meta);
            }
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
    // Create the user first.
    const result = await app.auth().createUserWithEmailAndPassword(email, password);
    await result.user.updateProfile({ displayName });

    // Now create meta.
    // Have to do it here because we have displayName.
    const timestamp = app.firestore.Timestamp.now();
    await app.firestore().collection('users').doc(result.user.uid).set({
      uid: result.user.uid,
      email,
      displayName,
      created: timestamp,
      updated: timestamp
    });
  }
);

const signIn = createAsyncThunk(
  'signIn',
  async ({ email, password }) => {
    await app.auth().signInWithEmailAndPassword(email, password);
  }
);

const signOut = createAsyncThunk(
  'signOut',
  async () => {
    await app.auth().signOut();
  }
);

const { actions: generatedActions, reducer } = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setIsSignedIn: setValue('isSignedIn'),
    setMeta: setValue('meta'),
    setClaims: setValue('claims'),
    setImage: setValue('image'),
    reset: reset(initialState)
  },
  extraReducers: {
    [signUp.rejected]: setError,
    [signIn.rejected]: setError,
    [signOut.rejected]: setError
  }
});

const select = ({ user }) => user;
const selectors = { select };

const actions = { ...generatedActions, init, signUp, signIn, signOut };

export { selectors, actions };
export default reducer;
