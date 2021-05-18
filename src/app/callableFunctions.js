const CALLABLE_FUNCTIONS = {
  ROOMS: 'roomsFE',
  RECORDINGS: 'recordingsFE',
  COMPOSITES: 'compositesFE',
  ASSETS: 'assetsFE',
  CREATE_COMPOSITE: 'createCompositeFE',
  PROCESS_VIDEO: 'processVideo',
  SET_PRIVILEGE: 'setPrivilege',

  GET_USER: 'getUser',

  CREATE_STUDENT: 'createStudent',

  CREATE_INVITE: 'createInvite',
  // GET_INVITES_TO: 'getInvitesTo',
  // GET_INVITES_FROM: 'getInvitesFrom',
  UPDATE_INVITE: 'updateInvite',
  DELETE_INVITE: 'deleteInvite',
  LAUNCH: 'launch',
  END: 'end',

  CREATE_COURSE: 'createCourse',
  UPDATE_COURSE: 'updateCourse',
  GIVE_COURSE: 'giveCourse',
  DELETE_COURSE: 'deleteCourse',
  GET_CREATED_COURSES: 'getCreatedCourses',

  CREATE_ITEM: 'createItem',
  UPDATE_ITEM: 'updateItem',
  DELETE_ITEM: 'deleteItem',
  SEND_ITEM: 'sendItem',

  STRIPE_CANCEL_SUBSCRIPTION: 'cancelSubscription',

  GET_ALL_COURSES: 'getAllCourses',
};

export {
  CALLABLE_FUNCTIONS,
};
