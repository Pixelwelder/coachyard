import { combineReducers, createSelector } from '@reduxjs/toolkit';
import createCourseSlice from './createCourseSlice';
import editCourseSlice from './editCourseSlice';
import createItemSlice from './createItemSlice';
import editItemSlice from './editItemSlice';
import createAccountSlice from './createAccountSlice';
import { deleteCourseSlice, deleteItemSlice } from './deleteSlice';

// Create a combined reducer, with one slice per UI element.
export default combineReducers({
  createAccount: createAccountSlice.reducer,
  createCourse: createCourseSlice.reducer,
  editCourse: editCourseSlice.reducer,
  createItem: createItemSlice.reducer,
  editItem: editItemSlice.reducer,
  deleteCourse: deleteCourseSlice.reducer,
  deleteItem: deleteItemSlice.reducer
});

const select = ({ ui2 }) => ui2;
const selectCreateAccount = createSelector(select, ({ createAccount }) => createAccount);
const selectCreateCourse = createSelector(select, ({ createCourse }) => createCourse);
const selectEditCourse = createSelector(select, ({ editCourse }) => editCourse);
const selectCreateItem = createSelector(select, ({ createItem }) => createItem);
const selectEditItem = createSelector(select, ({ editItem }) => editItem);
const selectDeleteCourse = createSelector(select, ({ deleteCourse }) => deleteCourse);
const selectDeleteItem = createSelector(select, ({ deleteItem }) => deleteItem);
const selectors = {
  select,
  createAccount: { select: selectCreateAccount },
  createCourse: { select: selectCreateCourse },
  editCourse: { select: selectEditCourse },
  createItem: { select: selectCreateItem },
  editItem: { select: selectEditItem },
  deleteCourse: { select: selectDeleteCourse },
  deleteItem: { select: selectDeleteItem }
};

const actions = {
  createAccount: createAccountSlice.actions,
  createCourse: createCourseSlice.actions,
  editCourse: editCourseSlice.actions,
  createItem: createItemSlice.actions,
  editItem: editItemSlice.actions,
  deleteCourse: deleteCourseSlice.actions,
  deleteItem: deleteItemSlice.actions
}

export { selectors, actions };
