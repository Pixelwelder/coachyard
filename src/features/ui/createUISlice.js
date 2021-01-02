import { createSlice } from '@reduxjs/toolkit';
import { setValue, setValues, reset, isThisAction } from '../../util/reduxUtils';
import MODES from './Modes';
import { isFulfilledAction, isPendingAction, isRejectedAction } from '../../util/reduxUtils';

/**
 * @param name - the name of this piece of state
 * @param initialState
 * @returns {Slice<unknown, {setValues: setValues, setIsEditing: (function(*, *): void), reset: (function(): *), open: reducers.open}, string>}
 */
export const createUISlice = ({ name, initialState, reducers = {} }) => {
  return createSlice({
    name,
    initialState: {
      error: null,
      isOpen: false,
      isLoading: false,
      ...initialState,
    },
    reducers: {
      open: (state) => ({ ...initialState, isOpen: true }),
      reset: reset(initialState),
      setValues,
      setIsEditing: setValue('isEditing'),
      ...reducers
    },
    extraReducers: (builder) => {
      builder
        .addMatcher(isThisAction(name), (state, action) => {
          if (isPendingAction(action)) {
            // console.log(name, 'is definitely pending');
          }
        })
        .addMatcher(isPendingAction, (state, action) => {
          if (isThisAction(name)(action)) {
            state.isLoading = true;
            state.error = initialState.error;
          }
        })
        .addMatcher(isRejectedAction, (state, action) => {
          if (isThisAction(name)(action)) {
            state.isLoading = false;
            state.error = action.payload;
            console.log('REJECTED', action.type);
          }
        })
        .addMatcher(isFulfilledAction, (state, action) => {
          if (isThisAction(name)(action)) {
            state.isLoading = false;
            state.isOpen = false;
            console.log('FULFILLED', action.type);
          }
        })
    }
  })
};
