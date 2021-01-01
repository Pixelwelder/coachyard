import { createSlice } from '@reduxjs/toolkit';
import { setValue, setValues, reset } from '../../util/reduxUtils';

// TODO isLoading, error
export const createUISlice = ({ name, initialState }) => {
  return createSlice({
    name,
    initialState,
    reducers: {
      reset: reset(initialState),
      setValues,
      setIsEditing: setValue('isEditing')
    }
  })
};
