import { configureStore } from '@reduxjs/toolkit';
import counterReducer from '../features/counter/counterSlice';
import logReducer from '../features/log/logSlice'

export default configureStore({
  reducer: {
    counter: counterReducer,
    log: logReducer
  },
});
