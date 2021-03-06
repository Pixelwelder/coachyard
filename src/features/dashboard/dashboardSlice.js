import { createSlice } from '@reduxjs/toolkit';
import { setValue } from '../../util/reduxUtils';

export const TABS = {
  COURSES: 0,
  STUDENTS: 1,
  CHATS: 2,
  SCHEDULE: 3
}

const name = 'dashboard';
const initialState = {
  tab: TABS.SCHEDULE
};

const { reducer, actions: generatedActions } = createSlice({
  name,
  initialState,
  reducers: {
    setTab: setValue('tab')
  }
});

const select = ({ dashboard }) => dashboard;
const selectors = { select };

const actions = { ...generatedActions };

export { selectors, actions };
export default reducer;
