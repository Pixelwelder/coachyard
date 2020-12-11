import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  showAccount: false
};

const { actions, reducer } = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setShowAccount: (state, action) => { state.showAccount = action.payload; }
  }
});

const select = ({ ui }) => ui;
const selectors = { select };

export { selectors, actions };
export default reducer;
