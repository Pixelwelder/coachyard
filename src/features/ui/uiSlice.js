import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  showAccount: false,
  showNewCourseDialog: false
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
    }
  }
});

const select = ({ ui }) => ui;
const selectors = { select };

export { selectors, actions };
export default reducer;
