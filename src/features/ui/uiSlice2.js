import { combineReducers, createSelector } from '@reduxjs/toolkit';
import createCourseSlice from './createCourseSlice';
import editCourseSlice from './editCourseSlice';
import createItemSlice from './createItemSlice';
import editItemSlice from './editItemSlice';
import createAccountSlice from './createAccountSlice';
import accountSlice from './accountSlice';
import editCoachSlice from './editCoachSlice';
import { deleteCourseSlice, deleteItemSlice } from './deleteSlice';

// Create a combined reducer, with one slice per UI element.
export default combineReducers({
  createAccount: createAccountSlice.reducer,
  createCourse: createCourseSlice.reducer,
  editCourse: editCourseSlice.reducer,
  createItem: createItemSlice.reducer,
  editItem: editItemSlice.reducer,
  deleteCourse: deleteCourseSlice.reducer,
  deleteItem: deleteItemSlice.reducer,
  editCoach: editCoachSlice.reducer,
  account: accountSlice.reducer
});

const select = ({ ui2 }) => ui2;
const selectCreateAccount = createSelector(select, ({ createAccount }) => createAccount);
const selectCreateCourse = createSelector(select, ({ createCourse }) => createCourse);
const selectEditCourse = createSelector(select, ({ editCourse }) => editCourse);
const selectCreateItem = createSelector(select, ({ createItem }) => createItem);
const selectEditItem = createSelector(select, ({ editItem }) => editItem);
const selectDeleteCourse = createSelector(select, ({ deleteCourse }) => deleteCourse);
const selectDeleteItem = createSelector(select, ({ deleteItem }) => deleteItem);
const selectEditCoach = createSelector(select, ({ editCoach }) => editCoach);
const selectAccount = createSelector(select, ({ account }) => account);
const selectors = {
  select,
  createAccount: { select: selectCreateAccount },
  createCourse: { select: selectCreateCourse },
  editCourse: { select: selectEditCourse },
  createItem: { select: selectCreateItem },
  editItem: { select: selectEditItem },
  deleteCourse: { select: selectDeleteCourse },
  deleteItem: { select: selectDeleteItem },
  editCoach: { select: selectEditCoach },
  account: { select: selectAccount }
};

const actions = {
  createAccount: createAccountSlice.actions,
  createCourse: createCourseSlice.actions,
  editCourse: editCourseSlice.actions,
  createItem: createItemSlice.actions,
  editItem: editItemSlice.actions,
  deleteCourse: deleteCourseSlice.actions,
  deleteItem: deleteItemSlice.actions,
  editCoach: editCoachSlice.actions,
  account: accountSlice.actions
};

export { selectors, actions };
