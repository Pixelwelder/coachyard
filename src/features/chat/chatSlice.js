import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import app from 'firebase/app';
import { setValue } from '../../util/reduxUtils';

const name = 'chat';
const initialState = {
  messages: [],
  message: ''
};

let unsubscribeMessages = () => {};
const init = createAsyncThunk(
  `${name}/init`,
  async (_, { getState }) => {

    app.auth().onAuthStateChanged((authUser) => {
      unsubscribeMessages();
      if (authUser) {
        // unsubscribeMessages = app.firestore().collection('')
      }
    })
  }
);

const submit = createAsyncThunk(
  `${name}/submit`,
  async () => {
    const { uid } = app.auth().currentUser;
    app.firestore().collection('courses')
  }
);

const { reducer, actions: generatedActions } = createSlice({
  name,
  initialState,
  reducers: {
    setMessage: setValue('message')
  }
});

const actions = { ...generatedActions, init, submit };

const select = ({ chat }) => chat;
const selectors = { select };

export { actions, selectors };
export default reducer;
