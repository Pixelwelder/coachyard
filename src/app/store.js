import { configureStore } from '@reduxjs/toolkit';

import appReducer from '../features/app/appSlice';
import logReducer from '../features/log/logSlice';
import adminReducer from '../features/admin/adminSlice';
import navReducer from '../features/nav/navSlice';
import videoReducer from '../features/videoIframe/videoSlice';
import courseReducer from '../features/course/courseSlice';
import assetsReducer from '../app/assets';
import sessionReducer from '../features/session/sessionSlice';
import uiReducer from '../features/ui/uiSlice';
import teacherReducer from '../features/teacher/teacherSlice';
import invitesReducer from '../features/invites/invitesSlice';
import billingReducer from '../features/billing/billingSlice';
import catalogReducer from '../features/catalog/catalogSlice';

export default configureStore({
  reducer: {
    app: appReducer,
    log: logReducer,
    admin: adminReducer,
    nav: navReducer,
    video: videoReducer,
    course: courseReducer,
    assets: assetsReducer,
    session: sessionReducer,
    ui: uiReducer,
    teacher: teacherReducer,
    invites: invitesReducer,
    billing: billingReducer,
    catalog: catalogReducer
  }
});
