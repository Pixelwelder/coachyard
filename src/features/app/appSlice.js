import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import app from 'firebase/app';

import firebaseConfig from '../../__config__/firebase.json';

const initialState = {
  initialized: false
};

const init = createAsyncThunk(
  'init',
  async (_, { getState, dispatch }) => {
    console.log('init');
    app.initializeApp(firebaseConfig);
    console.log('init complete');
  }
)

const appSlice = createSlice({
  name: 'init',
  initialState,
  extraReducers: {
    [init.fulfilled]: (state) => {
      state.initialized = true;
    }
  }
});

const actions = { init };
const reducer = appSlice.reducer;

export { actions };
export default reducer;
