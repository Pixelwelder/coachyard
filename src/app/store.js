import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';

import appReducer from '../features/app/appSlice';
import userReducer from '../features/app/userSlice';
import uiReducer from '../features/ui/uiSlice';
import uiReducer2 from '../features/ui/uiSlice2';
import billingReducer2 from '../features/billing2/billingSlice2';
import catalogReducer from '../features/catalog/catalogSlice';
import selectedCourseReducer from '../features/course/selectedCourseSlice';
import schedulingReducer from '../features/scheduling/schedulingSlice';
import coachReducer from '../features/coach/coachSlice';
import dashboardReducer from '../features/dashboard/dashboardSlice';

export default configureStore({
  reducer: {
    app: appReducer,
    user: userReducer,
    ui: uiReducer,
    ui2: uiReducer2,
    billing: billingReducer2,
    catalog: catalogReducer,
    selectedCourse: selectedCourseReducer,
    scheduling: schedulingReducer,
    coach: coachReducer,
    dashboard: dashboardReducer
  },
  middleware: getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: ['auth/stateChanged']
    }
  })
});
