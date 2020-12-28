import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { selectors as catalogSelectors } from '../catalog/catalogSlice';

const initialState = {
  id: ''
};

const { actions: generatedActions, reducer } = createSlice({
  name: 'course',
  initialState,
  reducers: {
    setId: (state, action) => { state.id = action.payload; }
  }
});

const actions = { ...generatedActions };

const select = ({ selectedCourse }) => selectedCourse
const selectSelectedCourse = createSelector(
  catalogSelectors.selectTeaching, // TODO
  select,
  ({ courses }, { id }) => courses[id]
);
const selectors = { select, selectSelectedCourse };

export { actions, selectors };
export default reducer;
