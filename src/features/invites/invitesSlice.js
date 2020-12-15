import { createAsyncThunk, createSlice, createSelector } from '@reduxjs/toolkit';
import app from 'firebase/app';
import { CALLABLE_FUNCTIONS } from '../../app/callableFunctions';

const initialState = {
  invitesTo: [],
  invitesFrom: [],

  isLoading: false,
  error: '',
  showNewDialog: false,
  displayName: '',
  email: ''
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
  async (_, { getState, dispatch }) => {
    const state = getState();
    const { email, displayName } = selectors.select(state);
    const createInviteCallable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.CREATE_INVITE);
    const result = await createInviteCallable({ email, displayName });
    dispatch(generatedActions.setShowNewDialog(false));
    dispatch(getInvitesFrom());
  }
);

const acceptInvite = createAsyncThunk(
  'acceptInvite',
  async (params, { dispatch }) => {
    console.log('accept invite', params);
    const acceptInviteCallable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.ACCEPT_INVITE);
    const result = await acceptInviteCallable(params);
    console.log('result', result);
    await dispatch(getInvitesTo());
  }
);

const onPending = initialState => (state) => {
  state.isLoading = true;
  state.error = initialState.error;
};

const onRejected = initialState => (state, action) => {
  state.isLoading = false;
  state.error = action.error;
};

const onFulfilled = name => (state, action) => {
  state.isLoading = false;
  if (name) state[name] = action.payload;
};

const setValue = name => (state, action) => {
  state[name] = action.payload;
}

const { reducer, actions: generatedActions } = createSlice({
  name: 'invites',
  initialState,
  reducers: {
    setShowNewDialog: setValue('showNewDialog'),
    setDisplayName: setValue('displayName'),
    setEmail: setValue('email')
  },
  extraReducers: {
    [getInvitesTo.pending]: onPending(initialState),
    [getInvitesTo.rejected]: onRejected(initialState),
    [getInvitesTo.fulfilled]: onFulfilled('invitesTo'),

    [getInvitesFrom.pending]: onPending(initialState),
    [getInvitesFrom.rejected]: onRejected(initialState),
    [getInvitesFrom.fulfilled]: onFulfilled('invitesFrom'),

    [createInvite.pending]: onPending(initialState),
    [createInvite.rejected]: onRejected(initialState),
    [createInvite.fulfilled]: (state, action) => {
      state.isLoading = false;
      state.email = initialState.email;
      state.displayName = initialState.displayName;
    },

    [acceptInvite.pending]: onPending(initialState),
    [acceptInvite.rejected]: onRejected(initialState),
    [acceptInvite.fulfilled]: onFulfilled(),
  }
});

const actions = { ...generatedActions, getInvitesFrom, getInvitesTo, createInvite, acceptInvite };

const addIds = items => items.map(item => ({ ...item, id: item.uid }));

const select = ({ invites }) => invites;
const selectInvitesFrom = createSelector(select, ({ invitesFrom }) => addIds(invitesFrom));
const selectInvitesTo = createSelector(select, ({ invitesTo }) => addIds(invitesTo));
const selectors = { select, selectInvitesFrom, selectInvitesTo };

export { actions, selectors };
export default reducer;
