import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { reset, setError, setValue } from '../../util/reduxUtils';
import { parseUnserializables } from '../../util/firestoreUtils';
import app from 'firebase/app';
import { EventTypes } from '../../constants/analytics';
import { toKebab } from '../../util/string';

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
            console.log('user changed');
            if (snapshot.exists) {
              const meta = parseUnserializables(snapshot.data());
              generatedActions.setMeta(meta);

              try {
                const url = await app.storage().ref(`/avatars/${meta.image}`).getDownloadURL();
                dispatch(generatedActions.setImage(url));
              } catch (error) {
                console.warn(`userSlice: avatar doesn't exist yet.`);
              }

              // Check the subscription separately.
              // TODO This should be entirely authUser.getIdTokenResult()
              // const { data } = await app.functions().httpsCallable('checkSubscription')();
              // console.log('subscription', data);

              // Grab claims.
              const { claims } = await authUser.getIdTokenResult(true);
              console.log('claims', claims);
              dispatch(generatedActions.setClaims(claims));
            } else {
              generatedActions.setMeta(initialState.meta);
            }
          });
      } else {
        dispatch(generatedActions.reset());
      }
    });
  }
);

let unsubscribeImage;
const signUp = createAsyncThunk(
  'signUp',
  async ({ email, password, displayName }) => {
    // Create the user first.
    app.analytics().logEvent(EventTypes.SIGN_UP_ATTEMPTED);
    const result = await app.auth().createUserWithEmailAndPassword(email, password);
    await result.user.updateProfile({ displayName });
    app.analytics().logEvent(EventTypes.SIGN_UP_SUCCEEDED);

    // Now create meta.
    // Have to do it here because we have displayName.
    // We'll need a unique slug for their URL.
    let slug = toKebab(displayName);
    console.log('checking for slug', slug);
    const existing = await app.firestore().collection('users')
      .where('slug', '==', slug).get();
    // TODO Need a real solution here.
    if (existing.size) slug = `${slug}-${Math.round(Math.random() * 1000)}`;

    console.log('creating user meta');
    const timestamp = app.firestore.Timestamp.now();
    await app.firestore().collection('users').doc(result.user.uid).set({
      uid: result.user.uid,
      email,
      displayName,
      description: `${displayName} is a coach with a passion for all things coaching.`,
      slug,
      created: timestamp,
      updated: timestamp
    });
    console.log('created');

    if (unsubscribeImage) unsubscribeImage();
    // unsubscribeImage = app.storage().ref(`avatars/${result.user.id}.png`).
  }
);

const signIn = createAsyncThunk(
  'signIn',
  async ({ email, password }) => {
    app.analytics().logEvent(EventTypes.SIGN_IN_ATTEMPTED);
    await app.auth().signInWithEmailAndPassword(email, password);
  }
);

const signOut = createAsyncThunk(
  'signOut',
  async () => {
    app.analytics().logEvent(EventTypes.SIGN_OUT);
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
