import { createAsyncThunk, createSlice, createSelector } from '@reduxjs/toolkit';

const initialState = {
  isDisplayed: true
};

const init = createAsyncThunk(
  'initSession',
  async () => {}
);

const { reducer, actions: generatedActions } = createSlice({
  name: 'session',
  initialState,
  reducers: {},
  extraReducers: {}
});

const actions = { ...generatedActions };

const select = ({ session }) => session;
const selectors = { select };

export { actions, selectors };
export default reducer;
