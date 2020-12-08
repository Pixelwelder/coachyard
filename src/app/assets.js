import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { actions as logActions, createLog } from '../features/log/logSlice';
import app from 'firebase/app';
import { CALLABLE_FUNCTIONS } from './callableFunctions';
import { ERROR } from '../features/log/logTypes';

const initialState = {
  isLoading: false,
  assets: {},
  playbackIdsById: {}
};

const fetchAssets = createAsyncThunk(
  'fetchAssets',
  async (_, { dispatch }) => {
    dispatch(logActions.log(createLog(`Fetching assets...` )));
    const assets = app.functions().httpsCallable(CALLABLE_FUNCTIONS.ASSETS);
    const result = await assets({ method: 'get' });
    dispatch(logActions.log(createLog(`Fetched assets`)));
    return result;
  }
);

const fetchPlaybackId = createAsyncThunk(
  'fetchPlaybackIds',
  async ({ id }, { dispatch, getState }) => {
    // const assets = app.functions().httpsCallable(CALLABLE_FUNCTIONS.ASSETS);
    // try {
    //   const result = await assets({ method: 'get', id, endpoint: 'playback-ids' });
    //   console.log('fetchPlaybackIds', result);
    // } catch (error) {
    //   console.error(error);
    // }
    // return {}
  }
);

const init = createAsyncThunk(
  'init',
  async (_, { dispatch }) => {
    try {
      dispatch(logActions.log(createLog(`--- Assets.init ---` )));
      // await dispatch(fetchAssets());
      dispatch(logActions.log(createLog(`--- Assets.init complete ---` )));
    } catch (error) {
      console.error(error);
      dispatch(logActions.log(createLog(error.message, ERROR)));
      dispatch(logActions.log(createLog(`--- Assets.init did not complete ---`, ERROR )));
      throw error;
    }
  }
);

const { reducer, actions: generatedActions } = createSlice({
  name: 'assets',
  initialState,
  reducers: {},
  extraReducers: {
    [fetchAssets.pending]: (state) => { state.isLoading = true; },
    [fetchAssets.rejected]: (state) => { state.isLoading = false; },
    [fetchAssets.fulfilled]: (state, action) => {
      state.isLoading = false;
      state.assets = action.payload;
    }
  }
});

const select = ({ assets }) => assets;
const selectAssets = createSelector(select, ({ assets }) => {
  return assets?.data?.result?.data || [];
});
const selectPlaybackIds = createSelector(select, ({ playbackIds }) => {
  return playbackIds;
});
const selectors = { select, selectAssets };

const actions = { ...generatedActions, init, fetchPlaybackId };

export { actions, selectors };
export default reducer;
