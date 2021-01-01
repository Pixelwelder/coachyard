export const reset = initialState => () => {
  return initialState;
};

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
