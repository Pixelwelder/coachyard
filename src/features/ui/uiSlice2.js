import { combineReducers, createSelector } from '@reduxjs/toolkit';
import createCourseSlice from './createCourseSlice';
import editCourseSlice from './editCourseSlice';
import editItemSlice from './editItemSlice';
import { deleteCourseSlice, deleteItemSlice } from './deleteSlice';

// Create a combined reducer, with one slice per UI element.
export default combineReducers({
  createCourse: createCourseSlice.reducer,
  editCourse: editCourseSlice.reducer,
  editItem: editItemSlice.reducer,
  deleteCourse: deleteCourseSlice.reducer,
  deleteItem: deleteItemSlice.reducer
});

const select = ({ ui2 }) => ui2;
const selectCreateCourse = createSelector(select, ({ createCourse }) => createCourse);
const selectEditCourse = createSelector(select, ({ editCourse }) => editCourse);
const selectEditItem = createSelector(select, ({ editItem }) => editItem);
const selectDeleteCourse = createSelector(select, ({ deleteCourse }) => deleteCourse);
const selectDeleteItem = createSelector(select, ({ deleteItem }) => deleteItem);
const selectors = {
  select,
  createCourse: { select: selectCreateCourse },
  editCourse: { select: selectEditCourse },
  editItem: { select: selectEditItem },
  deleteCourse: { select: selectDeleteCourse },
  deleteItem: { select: selectDeleteItem }
};

const actions = {
  createCourse: createCourseSlice.actions,
  editCourse: editCourseSlice.actions,
  editItem: editItemSlice.actions,
  deleteCourse: deleteCourseSlice.actions,
  deleteItem: deleteItemSlice.actions
}

export { selectors, actions };
