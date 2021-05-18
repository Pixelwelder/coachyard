import { createSlice } from '@reduxjs/toolkit';
import MODES from './Modes';
import { reset, setValues } from '../../util/reduxUtils';

const initialState = {
  mode: MODES.CLOSED,
  toDelete: null,
};

const createDeleteSlice = ({ name }) => createSlice({
  name,
  initialState,
  reducers: {
    setValues,
    reset: reset(initialState),
  },
});

export const deleteCourseSlice = createDeleteSlice({ name: 'ui/deleteCourse' });
export const deleteItemSlice = createDeleteSlice({ name: 'ui/deleteItem' });
