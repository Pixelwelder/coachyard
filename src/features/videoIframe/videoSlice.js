import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import app from 'firebase/app';
import { CALLABLE_FUNCTIONS } from '../../app/callableFunctions';
import { actions as navActions, MAIN_TABS } from '../nav/navSlice';
import { actions as invitesActions } from '../invites/invitesSlice';

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
    await invitesActions.getInvitesFrom();
    await invitesActions.getInvitesTo();

    console.log('done launching', result);
  }
);

const end = createAsyncThunk(
  'end',
  async (params) => {
    console.log('stopping...');
    const launchCallable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.END);
    const result = await launchCallable(params);
    console.log('RESULT', result);
    await invitesActions.getInvitesFrom();
    await invitesActions.getInvitesTo();
    console.log('done');
  }
);

const join = createAsyncThunk(
  'join',
  async ({ url }, { dispatch }) => {
    dispatch(generatedActions.setUrl(url));
    dispatch(navActions.setMainTab(MAIN_TABS.VIDEO));
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

const actions = { ...generatedActions, launch, end, join };

const selectors = {
  select: ({ video }) => video
};

export { selectors, actions };
export default reducer;
