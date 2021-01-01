import { createSlice, combineReducers, createSelector } from '@reduxjs/toolkit';
import editCourseSlice from './editCourseSlice';

const slice1 = createSlice({
  name: 'slice1',
  initialState: 'slice2'
});

const slice2 = createSlice({
  name: 'slice2',
  initialState: {
    name: 'slice2'
  }
});

const isPendingAction = action => action.type.endsWith('/pending');
const isRejectedAction = action => action.type.endsWith('/rejected');

// Create a combined reducer, with one slice per UI element.
export default combineReducers({
  slice1: slice1.reducer,
  slice2: slice2.reducer,
  editCourse: editCourseSlice.reducer
});

const select = ({ ui2 }) => ui2;
const selectEditCourse = createSelector(select, ({ editCourse }) => editCourse);
const selectors = {
  select,
  editCourse: { select: selectEditCourse }
};

const actions = {
  editCourse: editCourseSlice.actions
}

export { selectors, actions };
