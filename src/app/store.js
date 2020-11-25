import { configureStore } from '@reduxjs/toolkit';

import appReducer from '../features/app/appSlice';
import counterReducer from '../features/counter/counterSlice';
import logReducer from '../features/log/logSlice'

export default configureStore({
  reducer: {
    app: appReducer,
    counter: counterReducer,
    log: logReducer
  },
});
