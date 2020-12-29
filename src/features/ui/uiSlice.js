import { createSlice } from '@reduxjs/toolkit';

const MODES = {
  VIEW: 'view',
  EDIT: 'edit',
  CREATE: 'create',
  DELETE: 'delete',
  CLOSED: 'closed',
  OPEN: 'open'
};

const baseDialog = {
  mode: MODES.CLOSED,
  isLoading: false,
  error: null
};

const initialState = {
  // TODO
  showAccount: false,

  newCourseDialog: {
    ...baseDialog,
    displayName: '',
    email: ''
  },

  newItemDialog: {
    ...baseDialog,
    displayName: '',
    description: '',
    file: ''
  },

  deleteDialog: {
    ...baseDialog,
    uid: ''
  }
};

const { actions, reducer } = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openDialog: (state, action) => {
      state[action.payload].mode = MODES.OPEN;
    },
    resetDialog: (state, action) => {
      state[action.payload] = initialState[action.payload]
    },
    setShowAccount: (state, action) => { state.showAccount = action.payload; },
    /**
     * payload - an object that is merged with the root state.
     */
    setUI: (state, action) => {
      Object.entries(action.payload).forEach(([name, value]) => {
        state[name] = value;
      });
    },
    resetUI: (state, action) => {
      state[action.payload] = initialState[action.payload];
    }
  }
});

const select = ({ ui }) => ui;
const selectors = { select };

export { selectors, actions, MODES };
export default reducer;
