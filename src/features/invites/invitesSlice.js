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

const createInvite = createAsyncThunk(
  'createInvite',
  async (_, { getState, dispatch }) => {
    const state = getState();
    const { email, displayName, date } = selectors.select(state);
    const createInviteCallable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.CREATE_INVITE);
    const result = await createInviteCallable({ email, displayName, date });
    console.log('result', result);
  }
);

const updateInvite = createAsyncThunk(
  'updateInvite',
  async (params, { dispatch }) => {
    console.log('update invite', params);
    const updateInviteCallable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.UPDATE_INVITE);
    const result = await updateInviteCallable(params);
    console.log('result', result);
    // await dispatch(getInvitesTo());
  }
);

const deleteInvite = createAsyncThunk(
  'deleteInvite',
  async (params, { dispatch }) => {
    console.log('deleting', params);
    const deleteInviteCallable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.DELETE_INVITE);
    const result = await deleteInviteCallable(params);
    console.log('result', result)
    // await dispatch(getInvitesFrom());
  }
);

const init = createAsyncThunk(
  'initInvites',
  async (_, { dispatch }) => {
    let fromListener;
    let toListener;

    // When invites change, this handler will fire.
    const createHandleSnapshot = actionCreator => (snapshot) => {
      console.log('invite snapshot:', snapshot.size);
      snapshot.docChanges().forEach((change) => {
        console.log('changed', change.type);
      });

      const invites = snapshot.docs.map(doc => doc.data());
      dispatch(actionCreator(invites));
    };

    app.auth().onAuthStateChanged((authUser) => {
      // Unsubscribe.
      if (fromListener) fromListener();
      if (toListener) toListener();

      // If someone logged in, listen to their invites.
      if (authUser) {
        const { uid, email } = authUser;

        // TODO Change to creatorUid
        if (fromListener) fromListener();
        fromListener = app.firestore().collection('invites').where('teacherUid', '==', uid)
          .onSnapshot(createHandleSnapshot(generatedActions.setInvitesFrom));

        if (toListener) toListener();
        toListener = app.firestore().collection('invites').where('email', '==', email)
          .onSnapshot(createHandleSnapshot(generatedActions.setInvitesTo));
      }
    });
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
  state.displayName = initialState.displayName;
  state.email = initialState.email;
  state.date = initialState.date;

  state.showNewDialog = false;
  state.isLoading = false;

  if (name) state[name] = action.payload;
};

const setValue = name => (state, action) => {
  state[name] = action.payload;
};

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
    },
    setInvitesFrom: setValue('invitesFrom'),
    setInvitesTo: setValue('invitesTo')
  },
  extraReducers: {
    [createInvite.pending]: onPending(initialState),
    [createInvite.rejected]: onRejected(initialState),
    [createInvite.fulfilled]: onFulfilled(),

    [updateInvite.pending]: onPending(initialState),
    [updateInvite.rejected]: onRejected(initialState),
    [updateInvite.fulfilled]: onFulfilled(),

    [deleteInvite.pending]: onPending(initialState),
    [deleteInvite.rejected]: onRejected(initialState),
    [deleteInvite.fulfilled]: onFulfilled(),
  }
});

const actions = {
  ...generatedActions,
  init, createInvite, updateInvite, deleteInvite
};

const addIds = items => items.map(item => ({ ...item, id: item.uid }));

const select = ({ invites }) => invites;
const selectInvitesFrom = createSelector(select, ({ invitesFrom }) => addIds(invitesFrom));
const selectInvitesTo = createSelector(select, ({ invitesTo }) => addIds(invitesTo));
const selectors = { select, selectInvitesFrom, selectInvitesTo };

export { actions, selectors };
export default reducer;
