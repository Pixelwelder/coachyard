import { createSlice } from '@reduxjs/toolkit';

const MODES = {
  VIEWING: 'viewing',
  DELETING: 'deleting'
};

const baseDialog = {
  open: false,
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
    displayName: ''
  },

  deleteDialog: {
    ...baseDialog,
    mode: MODES.VIEWING,
    uid: ''
  }
};

const { actions, reducer } = createSlice({
  name: 'ui',
  initialState,
  reducers: {
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
