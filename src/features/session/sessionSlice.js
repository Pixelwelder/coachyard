import { createAsyncThunk, createSlice, createSelector } from '@reduxjs/toolkit';
import SESSION_MODES from './sessionModes';

const initialState = {
  mode: SESSION_MODES.SIGN_UP
};

const init = createAsyncThunk(
  'initSession',
  async () => {}
);

const { reducer, actions: generatedActions } = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setMode: (state, action) => { state.mode = action.payload; }
  },
  extraReducers: {}
});

const actions = { ...generatedActions };

const select = ({ session }) => session;
const selectors = { select };

export { actions, selectors };
export default reducer;
