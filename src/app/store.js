import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';

import appReducer from '../features/app/appSlice';
import userReducer from '../features/app/userSlice';
import uiReducer from '../features/ui/uiSlice';
import uiReducer2 from '../features/ui/uiSlice2';
import billingReducer2 from '../features/billing2/billingSlice2';
import catalogReducer from '../features/catalog/catalogSlice';
import selectedCourseReducer from '../features/course/selectedCourseSlice';
import scheduleReducer from '../features/schedule/scheduleSlice';
import coachReducer from '../features/coach/coachSlice';
import dashboardReducer from '../features/dashboard/dashboardSlice';
import assetsReducer from '../features/assets/assetsSlice';

export default configureStore({
  reducer: {
    app: appReducer,
    user: userReducer,
    ui: uiReducer,
    ui2: uiReducer2,
    billing: billingReducer2,
    catalog: catalogReducer,
    selectedCourse: selectedCourseReducer,
    schedule: scheduleReducer,
    coach: coachReducer,
    dashboard: dashboardReducer,
    assets: assetsReducer,
  },
  middleware: getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: ['auth/stateChanged', 'confirmAction/open'],
      ignoredPaths: ['ui2.confirmAction.onConfirm'],
    },
  }),
});
