import { createAsyncThunk, createSlice, createSelector } from '@reduxjs/toolkit';
import app from 'firebase/app';
import { CALLABLE_FUNCTIONS } from '../../app/callableFunctions';

const initialState = {
  invitesTo: [],
  invitesFrom: []
};

const getInvitesTo = createAsyncThunk(
  'getInvitesTo',
  async () => {
    try {
      console.log('getting invites to');
      const { data } = await app.functions().httpsCallable(CALLABLE_FUNCTIONS.GET_INVITES_TO)();
      console.log('got invites to', data);
      return data;
    } catch (error) {
      console.error(error);
    }
  }
);

const getInvitesFrom = createAsyncThunk(
  'getInvitesFrom',
  async () => {
    console.log('getting invites from');
    const { data } = await app.functions().httpsCallable(CALLABLE_FUNCTIONS.GET_INVITES_FROM)();
    console.log('got invites from', data);
    return data;
  }
);

const createInvite = createAsyncThunk(
  'createInvite',
  async (params, { dispatch }) => {
    console.log('creating invite', params);
    const createInviteCallable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.CREATE_INVITE);
    const result = await createInviteCallable(params);
    console.log('result', result);
    dispatch(getInvitesFrom());
  }
);

const { reducer, actions: generatedActions } = createSlice({
  name: 'invites',
  initialState,
  extraReducers: {
    [getInvitesTo.fulfilled]: (state, action) => {
      state.invitesTo = action.payload;
    },
    [getInvitesFrom.fulfilled]: (state, action) => {
      state.invitesFrom = action.payload;
    }
  }
});

const actions = { ...generatedActions, getInvitesFrom, getInvitesTo, createInvite };

const select = ({ invites }) => invites;
const selectors = { select };

export { actions, selectors };
export default reducer;
