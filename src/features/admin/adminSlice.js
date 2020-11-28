import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { actions as logActions, createLog } from '../log/logSlice';
import app from 'firebase/app';

const initialState = {};

const fetchRooms = createAsyncThunk(
  'fetchRooms',
  async (_, { dispatch }) => {
    const rooms = app.functions().httpsCallable('roomsFE');
    try {
      const result = await rooms({ message: 'hi' });
      console.log(result);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
);

const init = createAsyncThunk(
  'initAdmin',
  async ({ firebase }, { dispatch }) => {
    dispatch(logActions.log(createLog(`Admin initializing...` )));
    await dispatch(fetchRooms());
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
