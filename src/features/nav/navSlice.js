import { createSlice } from '@reduxjs/toolkit';

const MAIN_TABS = {
  VIDEO: 0,
  COURSE: 1,
  TEACHER: 2,
  ADMIN: 3,
  DEV: 4
};

const ADMIN_TABS = {
  ROOMS: 0,
  RECORDINGS: 1,
  ASSETS: 2,
  COURSES: 3
}

const initialState = {
  mainTab: MAIN_TABS.COURSE,
  adminTab: ADMIN_TABS.ROOMS
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
