import { configureStore } from '@reduxjs/toolkit';

import appReducer from '../features/app/appSlice';
import counterReducer from '../features/counter/counterSlice';
import logReducer from '../features/log/logSlice';
import adminReducer from '../features/admin/adminSlice';

export default configureStore({
  reducer: {
    app: appReducer,
    counter: counterReducer,
    log: logReducer,
    admin: adminReducer
  },
});
