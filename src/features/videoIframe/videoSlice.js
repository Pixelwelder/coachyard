import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import app from 'firebase';
import { CALLABLE_FUNCTIONS } from '../../app/callableFunctions';
import { actions as navActions, MAIN_TABS } from '../nav/navSlice';

const initialState = {
  // url: 'https://coachyard.daily.co/VEEbX1t95wtc3h5mIEcE'
  url: ''
};

const launch = createAsyncThunk(
  'launch',
  async (params, { dispatch }) => {
    console.log('launching...');
    const launchCallable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.LAUNCH);
    const result = await launchCallable(params);
    console.log('RESULT', result);
    const { data: { url } } = result;
    dispatch(generatedActions.setUrl(url));
    dispatch(navActions.setMainTab(MAIN_TABS.VIDEO));
    console.log('done launching', result);
  }
);

const { actions: generatedActions, reducer } = createSlice({
  name: 'video',
  initialState,
  reducers: {
    setUrl: (state, action) => {
      state.url = action.payload;
    }
  }
});

const actions = { ...generatedActions, launch };

const selectors = {
  select: ({ video }) => video
};

export { selectors, actions };
export default reducer;
