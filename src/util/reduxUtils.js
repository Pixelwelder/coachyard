export const reset = initialState => () => initialState;
export const resetValue = (name, initialValue) => (state, action) => state[name] = initialValue;

export const setValue = name => (state, action) => {
  state[name] = action.payload;
};

export const setValues = (state, action) => {
  Object.entries(action.payload).forEach(([name, value]) => {
    state[name] = value;
  });
};

export const isPendingAction = action => action.type.endsWith('/pending');
export const isRejectedAction = action => action.type.endsWith('/rejected');
export const isFulfilledAction = action => action.type.endsWith('/fulfilled');
export const isThisAction = name => action => action.type.startsWith(name);
export const isAuthAction = action => action.type === 'auth/stateChanged';
