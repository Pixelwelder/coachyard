export const reset = initialState => () => initialState;
export const resetValue = (name, initialValue) => (state) => { state[name] = initialValue; };

export const setValue = name => (state, action) => {
  state[name] = action.payload;
};

export const setValues = (state, action) => {
  Object.entries(action.payload).forEach(([name, value]) => {
    state[name] = value;
  });
};

export const mergeValue = name => (state, action) => {
  state[name] = { ...state[name], ...action.payload };
};

export const setError = (state, action) => { state.error = action.error; };

export const isPendingAction = action => action.type.endsWith('/pending');
export const isRejectedAction = action => action.type.endsWith('/rejected');
export const isFulfilledAction = action => action.type.endsWith('/fulfilled');
export const isThisAction = name => action => action.type.startsWith(name);
export const isAuthAction = action => action.type === 'auth/stateChanged';
export const createIgnoreAction = string => action => action.type.indexOf(string) !== -1;

export const isThisPendingAction = name => action => isThisAction(name)(action) && isPendingAction(action);
export const isThisRejectedAction = name => action => isThisAction(name)(action) && isRejectedAction(action);
export const isThisFulfilledAction = name => action => isThisAction(name)(action) && isFulfilledAction(action);

export const loaderReducers = (name, initialState) => builder => builder
  .addMatcher(isThisAction(name), (state, action) => {
    if (isPendingAction(action)) {
      state.isLoading = true;
      state.error = initialState.error;
    } else if (isRejectedAction(action)) {
      state.isLoading = false;
      state.error = action.error;
    } else if (isFulfilledAction(action)) {
      state.isLoading = false;
    }
  });
