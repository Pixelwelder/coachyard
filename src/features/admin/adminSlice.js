import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { actions as logActions, createLog } from '../log/logSlice';

const initialState = {};

const init = createAsyncThunk(
  'initAdmin',
  async ({ firebase }, { dispatch }) => {
    dispatch(logActions.log(createLog(`Admin initializing...` )));
    const rooms = firebase.functions().httpsCallable('roomsFE');
    try {
      const result = await rooms({ message: 'hi' });
      console.log(result);
    } catch (error) {
      console.log(error);
      throw error;
    }
    dispatch(logActions.log(createLog(`Admin initialized` )));
  }
);

const slice = createSlice({
  name: 'admin',
  initialState,
  extraReducers: {

  }
});

const actions = { init };
const selectors = { select: ({ admin }) => admin };

export { actions, selectors }
export default slice;
