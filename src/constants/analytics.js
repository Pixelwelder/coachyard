const EventTypes = Object.freeze({
  STARTUP: 'startup',
  SIGN_UP_ATTEMPTED: 'signUpAttempted',
  SIGN_UP: 'signUp',
  SIGN_IN_ATTEMPTED: 'signInAttempted',
  SIGN_IN: 'signIn',
  SIGN_OUT: 'signOut',

  ADD_PAYMENT_METHOD_ATTEMPTED: 'addPaymentMethodAttempted',
  ADD_PAYMENT_METHOD: 'addPaymentMethod',
  CREATE_SUBSCRIPTION_ATTEMPTED: 'createSubscriptionAttempted',
  CREATE_SUBSCRIPTION: 'createSubscription',
  UPDATE_SUBSCRIPTION_ATTEMPTED: 'updateSubscriptionAttempted',
  UPDATE_SUBSCRIPTION: 'updateSubscription',
  CANCEL_SUBSCRIPTION_ATTEMPTED: 'cancelSubscriptionAttempted',
  CANCEL_SUBSCRIPTION: 'cancelSubscription',

  CREATE_COURSE_ATTEMPTED: 'createCourseAttempted',
  CREATE_COURSE: 'createCourse',
  UPDATE_COURSE_ATTEMPTED: 'updateCourseAttempted',
  UPDATE_COURSE: 'updateCourse',
  DELETE_COURSE_ATTEMPTED: 'deleteCourseAttempted',
  DELETE_COURSE: 'deleteCourse',

  CREATE_ITEM_ATTEMPTED: 'createItemAttempted',
  CREATE_ITEM: 'createItem',
  UPDATE_ITEM_ATTEMPTED: 'updateItemAttempted',
  UPDATE_ITEM: 'updateItem',
  DELETE_ITEM_ATTEMPTED: 'deleteItemAttempted',
  DELETE_ITEM: 'deleteItem',
  LAUNCH_ITEM_ATTEMPTED: 'launchItemAttempted',
  LAUNCH_ITEM: 'launchItem',
  END_ITEM_ATTEMPTED: 'endItemAttempted',
  END_ITEM: 'endItem',
  UPLOAD_ITEM_ATTEMPTED: 'uploadItemAttempted',
  UPLOAD_ITEM: 'uploadItem',
  SEND_TO_STREAMING_SERVER_ATTEMPTED: 'sendToStreamingServerAttempted',
  SEND_TO_STREAMING_SERVER: 'sendToStreamingServer',

  SELECT_COURSE: 'selectCourse',
  SELECT_ITEM: 'selectItem',
});

export { EventTypes };
