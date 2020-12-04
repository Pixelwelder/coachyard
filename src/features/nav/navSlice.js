import { createSlice } from '@reduxjs/toolkit';

const MAIN_TABS = {
  VIDEO: 0,
  ADMIN: 1,
  DEV: 2
};

const ADMIN_TABS = {
  ROOMS: 0,
  RECORDINGS: 1,
  ASSETS: 2
}

const initialState = {
  mainTab: MAIN_TABS.ADMIN,
  adminTab: ADMIN_TABS.ASSETS
};

const { actions, reducer } = createSlice({
  name: 'nav',
  initialState,
  reducers: {
    setMainTab: (state, action) => {
      state.mainTab = action.payload;
    },
    setAdminTab: (state, action) => {
      state.adminTab = action.payload;
    }
  }
});

const selectors = {
  select: ({ nav }) => nav
};

export { selectors, actions, MAIN_TABS, ADMIN_TABS };
export default reducer;
