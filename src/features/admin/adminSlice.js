import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { actions as logActions, createLog } from '../log/logSlice';
import app from 'firebase/app';
import { ERROR } from '../log/logTypes';

import { actions as videoActions } from '../videoIframe/videoSlice';

const initialState = {
  isLoading: true,
  data: {
    total_count: 0,
    data: [
      // {
        // api_created: true,
        // config: {},
        // created_at: '',
        // id: '',
        // name: '',
        // privacy: 'public',
        // uri: ''
      // }
    ]
  }
};

const fetchRooms = createAsyncThunk(
  'fetchRooms',
  async (_, { dispatch }) => {
    const rooms = app.functions().httpsCallable('roomsFE');
    try {
      dispatch(logActions.log(createLog('Fetching all rooms...')));
      const result = await rooms({ method: 'get' });
      console.log(result);
      dispatch(logActions.log(createLog(`Rooms fetched: ${result.data.result.data.length}`)));
      return result;
    } catch (error) {
      dispatch(logActions.log(createLog(error.message, ERROR)));
      console.error(error);
      throw error;
    }
  }
);

const createRoom = createAsyncThunk(
  'createRoom',
  async ({ name }, { dispatch }) => {
    const rooms = app.functions().httpsCallable('roomsFE');
    try {
      dispatch(logActions.log(createLog(`Creating room ${name}...`)));
      const result = await rooms({ method: 'post', name });
      dispatch(logActions.log(createLog(`Room ${name} created.`)));
      dispatch(fetchRooms());
    } catch (error) {
      dispatch(logActions.log(createLog(error.message, ERROR)));
      console.error(error);
      throw error;
    }
  }
);

const deleteRoom = createAsyncThunk(
  'deleteRoom',
  async ({ name }, { dispatch }) => {
    const rooms = app.functions().httpsCallable('roomsFE');
    try {
      dispatch(logActions.log(createLog(`Deleting room ${name}...`)));
      const result = await rooms({ method: 'delete', endpoint: name });
      dispatch(videoActions.setUrl(''));
      dispatch(fetchRooms());
      dispatch(logActions.log(createLog(`Room ${name} deleted.`)));
    } catch (error) {
      dispatch(logActions.log(createLog(error.message, ERROR)));
      console.error(error);
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

const { reducer } = createSlice({
  name: 'admin',
  initialState,
  extraReducers: {
    [fetchRooms.pending]: (state, action) => {
      state.isLoading = true;
      state.data = initialState.data;
    },
    [fetchRooms.rejected]: (state, action) => {
      state.isLoading = false;
    },
    [fetchRooms.fulfilled]: (state, action) => {
      const { data } = action.payload;
      console.log('?', data.result);
      state.isLoading = false;
      state.data = data.result;
    }
  }
});

const actions = { init, fetchRooms, createRoom, deleteRoom };

const select = ({ admin }) => admin;
const selectRooms = createSelector(
  select,
  (admin) => admin?.data?.data || []
);
const selectors = {
  select,
  selectRooms
};

export { actions, selectors }
export default reducer;
