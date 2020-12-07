import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { actions as logActions, createLog } from '../log/logSlice';
import app from 'firebase/app';
import { ERROR } from '../log/logTypes';

import { actions as videoActions } from '../videoIframe/videoSlice';

const initialState = {
  isLoading: true,
  rooms: {
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
  },
  recordings: {
    total_count: 0,
    data: []
  },
  assets: {
    total_count: 0,
    data: []
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
      console.log('RESULT', result);
      const { error, info } = result.data.result;
      if (error) {
        throw new Error(`${error} - ${info}`);
      }

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
      dispatch(logActions.log(createLog(`Room ${name} deleted.`)));
      dispatch(videoActions.setUrl(''));
      dispatch(fetchRooms());
    } catch (error) {
      dispatch(logActions.log(createLog(error.message, ERROR)));
      console.error(error);
      throw error;
    }
  }
);

const fetchRecordings = createAsyncThunk(
  'fetchRecordings',
  async (_, { dispatch }) => {
    try {
      dispatch(logActions.log(createLog(`Fetching recordings...`)));
      const recordings = app.functions().httpsCallable('recordingsFE');
      const result = await recordings({ method: 'get' });
      console.log('recordings', result);
      dispatch(logActions.log(createLog(`Recordings fetched`)));
      return result;
    } catch (error) {
      console.error(error);
      dispatch(logActions.log(createLog(error.message, ERROR)));
      throw error;
    }
  }
);

const fetchAssets = createAsyncThunk(
  'fetchAssets',
  async (_, { dispatch }) => {
    dispatch(logActions.log(createLog(`Fetching assets...` )));
    try {
      dispatch(logActions.log(createLog(`Fetched assets`)));
      const assets = app.functions().httpsCallable('assetsFE');
      const result = await assets({ method: 'get' });
      return result;
    } catch (error) {
      console.error(error);
      dispatch(logActions.log(createLog(error.message, ERROR)));
      throw error;
    }
  }
);

const deleteAsset = createAsyncThunk(
  'deleteAsset',
  async ({ name }, { dispatch }) => {
    dispatch(logActions.log(createLog(`Deleting asset...` )));
  }
);

const mergeVideos = createAsyncThunk(
  'mergeVideos',
  async (_, { dispatch }) => {
    try {
      dispatch(logActions.log(createLog(`Attempting video merge...`)));
      const processVideo = app.functions().httpsCallable('processVideo');
      const result = await processVideo();
      console.log(result);
      dispatch(logActions.log(createLog(`Video merge successful: ${Math.floor(result.data.totalTime/1000)}`)));
    } catch (error) {
      dispatch(logActions.log(createLog(error.message, ERROR)));
      console.error(error);
      throw error;
    }
  }
);

const createComposite = createAsyncThunk(
  'createComposite',
  async (args, { dispatch }) => {
    try {
      dispatch(logActions.log(createLog(`Creating composite...`)));
      const createComposite = app.functions().httpsCallable('createCompositeFE');
      const result = await createComposite(args);
      dispatch(logActions.log(createLog(`Composite created`)));
    } catch (error) {
      dispatch(logActions.log(createLog(error.message, ERROR)));
      console.error(error);
      throw error;
    }
  }
);

const fetchComposites = createAsyncThunk(
  'fetchComposites',
  async (_, { dispatch }) => {
    dispatch(logActions.log(createLog(`Fetching composites...` )));
    try {
      dispatch(logActions.log(createLog(`Fetched composites`)));
      const assets = app.functions().httpsCallable('compositesFE');
      const result = await assets({ method: 'get' });
      return result;
    } catch (error) {
      console.error(error);
      dispatch(logActions.log(createLog(error.message, ERROR)));
      throw error;
    }
  }
);

const init = createAsyncThunk(
  'initAdmin',
  async ({ firebase }, { dispatch }) => {
    dispatch(logActions.log(createLog(`Admin initializing...` )));
    await dispatch(fetchRooms());
    await dispatch(fetchRecordings());
    await dispatch(fetchAssets());
    await dispatch(fetchComposites());
    dispatch(logActions.log(createLog(`Admin initialized` )));
  }
);

const { reducer } = createSlice({
  name: 'admin',
  initialState,
  extraReducers: {
    [fetchRooms.pending]: (state, action) => {
      state.isLoading = true;
      state.rooms = initialState.rooms;
    },
    [fetchRooms.rejected]: (state, action) => {
      state.isLoading = false;
    },
    [fetchRooms.fulfilled]: (state, action) => {
      const { data } = action.payload;
      state.isLoading = false;
      state.rooms = data.result;
    },
    [createRoom.pending]: (state, action) => {
      state.isLoading = true;
    },
    [createRoom.rejected]: (state, action) => {
      state.isLoading = false;
    },
    [createRoom.fulfilled]: (state, action) => {
      state.isLoading = false;
    },
    [fetchRecordings.pending]: (state, action) => {
      state.isLoading = true;
      state.recordings = initialState.recordings;
    },
    [fetchRecordings.rejected]: (state, action) => {
      state.isLoading = false;
    },
    [fetchRecordings.fulfilled]: (state, action) => {
      const { data } = action.payload;
      state.isLoading = false;
      state.recordings = data.result;
    },
    [fetchComposites.pending]: (state, action) => {
      state.isLoading = true;
    },
    [fetchComposites.rejected]: (state, action) => {
      state.isLoading = false;
    },
    [fetchComposites.fulfilled]: (state, action) => {
      state.isLoading = false;
    },
    [fetchAssets.pending]: (state, action) => {
      state.isLoading = true;
      state.assets = initialState.assets;
    },
    [fetchAssets.rejected]: (state, action) => {
      state.isLoading = false;
    },
    [fetchAssets.fulfilled]: (state, action) => {
      state.isLoading = false;
      state.assets = {
        ...action.payload.data.result,
        total_count: action.payload.data.result.data.length
      };
    }
  }
});

const select = ({ admin }) => admin;
const selectRooms = createSelector(
  select,
  (admin) => admin.rooms.data || []
);
const selectRecordings = createSelector(
  select,
  (admin) => admin.recordings.data || []
);
const selectComposites = createSelector(
  select,
  ({ composites }) => composites.data || []
);
const selectAssets = createSelector(
  select,
  ({ assets }) => assets.data
);

const selectors = { select, selectRooms, selectRecordings, selectComposites, selectAssets };
const actions = {
  init, fetchRooms, createRoom, deleteRoom, mergeVideos, fetchRecordings, fetchComposites, fetchAssets, createComposite
};

export { actions, selectors }
export default reducer;
