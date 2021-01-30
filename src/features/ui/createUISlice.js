import { createSlice } from '@reduxjs/toolkit';
import { setValue, setValues, reset, isThisAction } from '../../util/reduxUtils';
import MODES from './Modes';
import { isFulfilledAction, isPendingAction, isRejectedAction } from '../../util/reduxUtils';

/**
 * @param name - the name of this piece of state
 * @param initialState
 * @returns {Slice<unknown, {setValues: setValues, setIsEditing: (function(*, *): void), reset: (function(): *), open: reducers.open}, string>}
 */
export const createUISlice = ({
  name,
  extraNames = [],
  initialState: _initialState,
  reducers = {},
  builderFunc
}) => {
  const initialState = {
    error: null,
    isOpen: false,
    isLoading: false,
    ..._initialState
  };

  return createSlice({
    name,
    initialState,
    reducers: {
      open: (state, action) => {
        const { payload = {} } = action;
        console.log('PAYLOAD', payload);
        const newState = Object.keys(initialState).reduce((accum, key) => ({
          ...accum, [key]: payload[key] || initialState[key]
        }), {});
        console.log('NEW STATE', newState);
        return { ...newState, isOpen: true };
      },
      reset: reset(initialState),
      setValues,
      setIsEditing: setValue('isEditing'),
      ...reducers
    },
    extraReducers: (builder) => {
      [name, ...extraNames].forEach((name) => {
        builder
          .addMatcher(isThisAction(name), (state, action) => {
            if (isPendingAction(action)) {
              state.isLoading = true;
              state.error = initialState.error;
            } else if (isRejectedAction(action)) {
              state.isLoading = false;
              state.error = action.error;
            } else if (isFulfilledAction(action)) {
              return initialState;
            }
          })
      })

      // builder
      //   .addMatcher(isThisAction(name), (state, action) => {
      //     master(name, action);
      //   })
      //   .addMatcher(isPendingAction, (state, action) => {
      //     if (isThisAction(name)(action)) {
      //       state.isLoading = true;
      //       state.error = initialState.error;
      //     }
      //   })
      //   .addMatcher(isRejectedAction, (state, action) => {
      //     if (isThisAction(name)(action)) {
      //       state.isLoading = false;
      //       state.error = action.payload;
      //       console.log('REJECTED', action.type);
      //     }
      //   })
      //   .addMatcher(isFulfilledAction, (state, action) => {
      //     if (isThisAction(name)(action)) {
      //       state.isLoading = false;
      //       state.isOpen = false;
      //       console.log('FULFILLED', action.type);
      //     }
      //   });

      if (builderFunc) {
        builderFunc(builder);
      }
    }
  })
};
