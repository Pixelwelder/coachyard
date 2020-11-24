import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import app from 'firebase/app';

import firebaseConfig from '../../__config__/firebase.json';
import { actions as logActions } from '../log/logSlice';
import { createLog } from '../log/logSlice';
import { ERROR } from '../log/logTypes';

const initialState = {
  initialized: false
};

const init = createAsyncThunk(
  'init',
  async (_, { getState, dispatch }) => {
    dispatch(logActions.log(createLog(`Initializing...` )));
    try {
      app.initializeApp(firebaseConfig);
    } catch (error) {
      dispatch(logActions.log(createLog(error.message, ERROR)));
    }
    dispatch(logActions.log(createLog(`Initialization complete.` )));
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
