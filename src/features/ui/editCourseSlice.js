// TODO isLoading, error
import { createSelector, createSlice } from '@reduxjs/toolkit';

const initialState = {
  isEditing: false,

  displayName: '',
  student: '',
  description: ''
};

const reset = initialState => () => {
  return initialState;
};

const setValue = (state, action) => {
  Object.entries(action.payload).forEach(([name, value]) => {
    state[name] = value;
  });
};

const slice = createSlice({
  name: 'editCourse',
  initialState: initialState,
  reducers: {
    reset: reset(initialState),
    setValue,
    setIsEditing: (state, action) => { state.isEditing = action.payload; }
  }
});

export default slice;
