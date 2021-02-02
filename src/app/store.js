import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';

import appReducer from '../features/app/appSlice';
import userReducer from '../features/app/userSlice';
import uiReducer from '../features/ui/uiSlice';
import uiReducer2 from '../features/ui/uiSlice2';
import billingReducer2 from '../features/billing2/billingSlice2';
import catalogReducer from '../features/catalog/catalogSlice';
import selectedCourseReducer from '../features/course/selectedCourseSlice';

export default configureStore({
  reducer: {
    app: appReducer,
    user: userReducer,
    ui: uiReducer,
    ui2: uiReducer2,
    billing2: billingReducer2,
    catalog: catalogReducer,
    selectedCourse: selectedCourseReducer
  },
  middleware: getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: ['auth/stateChanged']
    }
  })
});
