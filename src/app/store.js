import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';

import appReducer from '../features/app/appSlice';
import uiReducer from '../features/ui/uiSlice';
import uiReducer2 from '../features/ui/uiSlice2';
import billingReducer from '../features/billing/billingSlice';
import catalogReducer from '../features/catalog/catalogSlice';
import selectedCourseReducer from '../features/course/selectedCourseSlice';

export default configureStore({
  reducer: {
    app: appReducer,
    ui: uiReducer,
    ui2: uiReducer2,
    billing: billingReducer,
    catalog: catalogReducer,
    selectedCourse: selectedCourseReducer
  },
  middleware: getDefaultMiddleware({
    serializableCheck: {
      // We do unspeakable things in the UI reducer.
      ignoredActions: ['ui/openDialog', 'ui/setUI'],
      ignoredPaths: ['ui.deleteDialog.onConfirm', 'ui.newCourseDialog.onConfirm']
    }
  })
});
