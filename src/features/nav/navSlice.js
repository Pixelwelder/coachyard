import { createSlice } from '@reduxjs/toolkit';

const TABS = {
  VIDEO: 0,
  ADMIN: 1,
  DEV: 2
};

const initialState = {
  tab: TABS.ADMIN
};

const { actions, reducer } = createSlice({
  name: 'nav',
  initialState,
  reducers: {
    setTab: (state, action) => {
      state.tab = action.payload;
    }
  }
});

const selectors = {
  select: ({ nav }) => nav
};

export { selectors, actions, TABS };
export default reducer;
