import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { actions as logActions, createLog } from '../log/logSlice';
import app from 'firebase/app';

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
      const result = await rooms({ method: 'get' });
      return result;
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
    // await dispatch(fetchRooms());
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
      state.isLoading = false;
      state.data = data;
    }
  }
});

const actions = { init, fetchRooms };

const select = ({ admin }) => admin;
const selectRooms = createSelector(
  select,
  (admin) => admin?.data?.data?.data || []
);
const selectors = {
  select,
  selectRooms
};

export { actions, selectors }
export default reducer;
