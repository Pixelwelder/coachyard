import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

const initialState = {
  video: null
}

const { actions: generatedActions, reducer } = createSlice({
  name: 'course',
  reducers: {
    setVideo: (state, action) => {
      state.video = action.payload;
    }
  }
});

const select = ({ course }) => course;
const selectors = { select };
const actions = { ...generatedActions };

export { selectors, actions };
export default reducer;
