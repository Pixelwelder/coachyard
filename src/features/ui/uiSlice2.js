import { combineReducers, createSelector } from '@reduxjs/toolkit';
import editCourseSlice from './editCourseSlice';
import editItemSlice from './editItemSlice';

// Create a combined reducer, with one slice per UI element.
export default combineReducers({
  editCourse: editCourseSlice.reducer,
  editItem: editItemSlice.reducer
});

const select = ({ ui2 }) => ui2;
const selectEditCourse = createSelector(select, ({ editCourse }) => editCourse);
const selectEditItem = createSelector(select, ({ editItem }) => editItem);
const selectors = {
  select,
  editCourse: { select: selectEditCourse },
  editItem: { select: selectEditItem }
};

const actions = {
  editCourse: editCourseSlice.actions,
  editItem: editItemSlice.actions
}

export { selectors, actions };
