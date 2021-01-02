import { createSlice } from '@reduxjs/toolkit';
import { setValue, setValues, reset } from '../../util/reduxUtils';
import MODES from './Modes';

// TODO isLoading, error
export const createUISlice = ({ name, initialState }) => {
  return createSlice({
    name,
    initialState,
    reducers: {
      open: (state) => { state.mode = MODES.OPEN; },
      reset: reset(initialState),
      setValues,
      setIsEditing: setValue('isEditing')
    }
  })
};
