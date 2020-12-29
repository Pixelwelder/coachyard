import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // TODO
  showAccount: false,

  newCourseDialog: {
    show: false,
    isLoading: false,
    error: null,
    displayName: '',
    email: ''
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

export { selectors, actions };
export default reducer;
