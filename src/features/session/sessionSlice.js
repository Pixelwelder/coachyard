import app from 'firebase/app';
import { createAsyncThunk, createSlice, createSelector } from '@reduxjs/toolkit';
import SESSION_MODES from './sessionModes';

const initialState = {
  mode: SESSION_MODES.SIGN_UP,
  userMeta: {}
};

let unsubscribeUser;
const init = createAsyncThunk(
  'initSession',
  async (_, { dispatch }) => {
    app.auth().onAuthStateChanged((authUser) => {
      if (unsubscribeUser) unsubscribeUser();
      if (authUser) {
        unsubscribeUser = app.firestore()
          .collection('users')
          .doc(authUser.id)
          .onSnapshot((snapshot) => {
            dispatch(generatedActions.setUserMeta(snapshot.data()));
          });
      }
    });
  }
);

const setValue = name => (state, action) => {
  state[name] = action.payload;
};

const { reducer, actions: generatedActions } = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setMode: setValue('mode'),
    setUserMeta: setValue('userMeta')
  },
  extraReducers: {}
});

const actions = { ...generatedActions, init };

const select = ({ session }) => session;
const selectors = { select };

export { actions, selectors };
export default reducer;
