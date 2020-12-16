import { createAsyncThunk, createSlice, createSelector } from '@reduxjs/toolkit';
import app from 'firebase/app';
import { CALLABLE_FUNCTIONS } from '../../app/callableFunctions';
import { DateTime } from 'luxon';

const initialState = {
  invitesTo: [],
  invitesFrom: [],

  isLoading: false,
  error: '',
  showNewDialog: false,
  displayName: '',
  email: '',
  date: ''
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
    const { email, displayName, date } = selectors.select(state);
    const createInviteCallable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.CREATE_INVITE);
    const result = await createInviteCallable({ email, displayName, date });
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

const deleteInvite = createAsyncThunk(
  'deleteInvite',
  async (params, { dispatch }) => {
    console.log('deleting', params);
    const deleteInviteCallable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.DELETE_INVITE);
    const result = await deleteInviteCallable(params);
    console.log('result);')
    await dispatch(getInvitesFrom());
  }
)

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
    setShowNewDialog: (state, action) => {
      state.displayName = initialState.displayName;
      state.email = initialState.email;

      // Default to a date/time that's a nice round number in the future.
      // At least an hour away, at the top of the hour.
      const hours = DateTime.local().hour + 2;
      state.date = DateTime.local().set({ hours, minutes: 0, seconds: 0, milliseconds: 0 }).toUTC().toString();

      state.error = initialState.error;
      state.showNewDialog = action.payload;
    },
    setDisplayName: setValue('displayName'),
    setEmail: setValue('email'),
    setDate: (state, action) => {
      state.date = DateTime.fromISO(action.payload).toUTC().toString();
    }
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
      state.displayName = initialState.displayName;
      state.email = initialState.email;
      state.date = initialState.date;

      state.showNewDialog = false;
      state.isLoading = false;
    },

    [acceptInvite.pending]: onPending(initialState),
    [acceptInvite.rejected]: onRejected(initialState),
    [acceptInvite.fulfilled]: onFulfilled(),
  }
});

const actions = { ...generatedActions, getInvitesFrom, getInvitesTo, createInvite, acceptInvite, deleteInvite };

const addIds = items => items.map(item => ({ ...item, id: item.uid }));

const select = ({ invites }) => invites;
const selectInvitesFrom = createSelector(select, ({ invitesFrom }) => addIds(invitesFrom));
const selectInvitesTo = createSelector(select, ({ invitesTo }) => addIds(invitesTo));
const selectors = { select, selectInvitesFrom, selectInvitesTo };

export { actions, selectors };
export default reducer;
