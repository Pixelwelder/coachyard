import { createSlice } from "@reduxjs/toolkit";
import { LOG } from "./logTypes";

const createLog = (message, type = LOG) => ({
  message: `${message}`,
  type,
  timestamp: new Date().toLocaleTimeString()
});

const initialState = {
  // messages: new Array(100).fill(null).map(item => createLog(Math.random().toString()))
  messages: []
};

const { reducer, actions } = createSlice({
  name: 'log',
  initialState,
  reducers: {
    log: (state, action) => {
      state.messages.push(action.payload);
    },
    clear: (state) => {
      state.messages = initialState.messages;
    }
  }
});

const selectors = {
  select: ({ log }) => log
};

export { actions, selectors, createLog };
export default reducer;
