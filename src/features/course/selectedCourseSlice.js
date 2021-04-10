import app from 'firebase/app';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { parseUnserializables } from '../../util/firestoreUtils';
import { EventTypes } from '../../constants/analytics';
import { loaderReducers, resetValue } from '../../util/reduxUtils';
import { CALLABLE_FUNCTIONS } from '../../app/callableFunctions';

export const SIDEBAR_MODES = {
  TOC: 0,
  CHAT: 1
};

export const STUDENT_MANAGER_MODE = {
  LIST: 0,
  ADD: 1,
  DELETE: 2,
  VIEW_USER: 3,
  EDIT_INVITE: 4
};

export const EDIT_MODE = {
  DETAILS: 0,
  ACCESS: 1
};

const name = 'selectedCourse';
const initialState = {
  isLoading: false,
  error: null,

  isRecording: false,
  isFullscreen: false,

  token: null,
  tokens: [],
  course: null,
  courseCreator: null,
  courseCreatorProvider: null,
  courseCreatorImageUrl: '',
  student: null,
  items: {},

  parentCourse: null,
  parentItems: {},

  selectedItemUid: null,

  chat: [],
  chatMessage: '',
  numOutstandingChats: 0,

  imageUrls: {},

  sidebarMode: SIDEBAR_MODES.TOC,
  editMode: EDIT_MODE.DETAILS,

  studentManagerMode: STUDENT_MANAGER_MODE.LIST,
  emailResult: null,
  currentToken: null
};

/**
 * Parses a snapshot full of items into an object keyed by item uid.
 *
 * @param snapshot - a Firestore snapshot containing zero or more items, each with a uid property
 * @returns the items in an object keyed by uid
 */
const parseItems = (snapshot) => {
  if (!snapshot.size) return {};
  return snapshot.docs
    .map(item => parseUnserializables(item.data()))
    .reduce((accum, item) => ({ ...accum, [item.uid]: item }), {});
};

let unsubscribeToken = () => {};
let unsubscribeCourse = () => {};
let unsubscribeLocalItems = () => {};
let unsubscribeParentCourse = () => {};
let unsubscribeParentItems = () => {};
let unsubscribeCreator = () => {};
let unsubscribeCreatorProvider = () => {};
let unsubscribeStudent = () => {};
let unsubscribeStudentTokens = () => {};
let unsubscribeChat = () => {};

const setLocation = createAsyncThunk(
  `${name}/setLocation`,
  async ({ courseUid, itemUid, history }, { dispatch, getState }) => {
    app.analytics().logEvent(EventTypes.SELECT_COURSE_AND_ITEM, { courseUid, itemUid });

    // TODO TODO TODO If we're already there, don't waste time navigating.
    console.log('setLocation', courseUid, itemUid);

    unsubscribeCourse();
    unsubscribeCreator();
    unsubscribeCreatorProvider();
    unsubscribeLocalItems();
    unsubscribeParentCourse();
    unsubscribeParentItems();
    unsubscribeStudentTokens();
    unsubscribeChat();

    const abandon = () => {
      history.push('/dashboard');
    };

    if (!courseUid) return abandon();

    // First up: subscribe to the course.
    unsubscribeCourse = app.firestore().collection('courses').doc(courseUid)
      .onSnapshot(async (snapshot) => {
        if (snapshot.exists) {
          // This course exists.
          const course = parseUnserializables(snapshot.data());
          dispatch(generatedActions.setCourse(course));
          dispatch(generatedActions.setSelectedItemUid(itemUid));

          // Grab the creator.
          unsubscribeCreator = app.firestore().collection('users').doc(course.creatorUid)
            .onSnapshot((snapshot) => {
              dispatch(generatedActions.setCourseCreator(parseUnserializables(snapshot.data())));
            });

          // Grab the creator's scheduling provider.
          // TODO This doesn't have to happen now.
          unsubscribeCreatorProvider = app.firestore().collection('providers').doc(course.creatorUid)
            .onSnapshot((snapshot) => {
              dispatch(generatedActions.setCourseCreatorProvider(parseUnserializables(snapshot.data())));
            });

          // Grab the items.
          let localItems;
          unsubscribeLocalItems = snapshot.ref.collection('items')
            .onSnapshot((snapshot) => {
              localItems = parseItems(snapshot);
              dispatch(generatedActions.setItems(localItems));
            });

          // If it has a parent, grab the parent course
          let parentItems = {};
          if (course.parent) {
            unsubscribeParentCourse = app.firestore().collection('courses').doc(course.parent)
              .onSnapshot((snapshot) => {
                const parent = parseUnserializables(snapshot.data());
                dispatch(generatedActions.setParentCourse(parent));

                // ...and _its_ items.
                unsubscribeParentItems = snapshot.ref.collection('items')
                  .onSnapshot((snapshot) => {
                    parentItems = parseItems(snapshot);
                    dispatch(generatedActions.setItems(parentItems));
                  });
              });
          }

          // Get all access tokens.
          unsubscribeStudentTokens = app.firestore().collection('tokens')
            .where('courseUid', '==', course.uid)
            .onSnapshot((snapshot) => {
              const tokens = snapshot.docs.map(doc => parseUnserializables(doc.data()));
              dispatch(generatedActions.setTokens(tokens));
            });

          // Get the chat.
          unsubscribeChat = snapshot.ref.collection('chat')
            .onSnapshot((snapshot) => {
              const messages = snapshot.docs.map(doc => parseUnserializables(doc.data()));
              dispatch(generatedActions.setChat(messages));
              // TODO Outstanding messages.
            });

        } else {
          // This course does not exist, so we abandon ship.
          unsubscribeCourse();
          // return abandon();
        }
      })
  }
);

const update = createAsyncThunk(
  `${name}/update`,
  async (update, { dispatch, getState }) => {
    const { course: { uid } } = select(getState());
    app.analytics().logEvent(EventTypes.UPDATE_COURSE_ATTEMPTED);
    const callable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.UPDATE_COURSE);
    const result = await callable({ uid, update });
    app.analytics().logEvent(EventTypes.UPDATE_COURSE);
  }
);

const submitChatMessage = createAsyncThunk(
  `${name}/submitChatMessage`,
  async ({ courseUid, message }, { getState, dispatch }) => {
    try {
      const { uid } = app.auth().currentUser;
      // const state = getState();
      // const { course } = select(state);
      dispatch(generatedActions.setChatMessage(''));
      await app.firestore().collection('courses')
        .doc(courseUid)
        .collection('chat')
        .doc()
        .set({
          sender: uid,
          text: message,
          created: app.firestore.Timestamp.now()
        });

      // await app.firestore().collection('courses').doc(course.uid).update({ numChats: })
    } catch (error) {
      console.error(error);
    }
  }
);

const searchForEmail = createAsyncThunk(
  `${name}/searchForEmail`,
  async ({ email }, { dispatch, getState }) => {
    dispatch(generatedActions.setEmailResult(initialState.emailResult));
    const result = await app.firestore()
      .collection('users')
      .where('email', '==', email)
      .get();

    if (result.size) {
      const user = result.docs[0].data();
      // Check for dupe.
      const { course } = select(getState());
      const tokenDocs = await app.firestore()
        .collection('tokens')
        .where('user', '==', user.uid)
        .where('courseUid', '==', course.uid)
        .get();
      if (tokenDocs.size) throw new Error(`${user.displayName} already has access to this course.`);

      dispatch(generatedActions.setEmailResult(parseUnserializables(user)));
    } else {
      dispatch(generatedActions.setEmailResult(email));
    }
    dispatch(generatedActions.setStudentManagerMode(STUDENT_MANAGER_MODE.VIEW_USER))
  }
);

const addUser = createAsyncThunk(
  `${name}/addUser`,
  async (_, { getState, dispatch }) => {
    const { emailResult, course } = select(getState());
    if (!emailResult) throw new Error('No email.');
    if (!course) throw new Error('No course.');

    const studentEmail = typeof emailResult === 'object' ? emailResult.email : emailResult;
    const { uid: courseUid } = course;

    const result = await app.functions().httpsCallable('addUser')({ studentEmail, courseUid });
    dispatch(generatedActions.resetEmailResult());
    dispatch(generatedActions.setStudentManagerMode(STUDENT_MANAGER_MODE.LIST));
  }
);

// TODO Duplicate
const purchaseCourse = createAsyncThunk(
  `${name}/purchase`,
  async (_, { getState }) => {
    const { course: { uid: courseUid } } = select(getState());
    const { data: newCourse } = await app.functions().httpsCallable('purchaseCourse')({
      courseUid,
      studentUid: app.auth().currentUser.uid
    });
    return newCourse;
  }
);

const removeUser = createAsyncThunk(
  `${name}/removeUser`,
  async (_, { getState, dispatch }) => {
    const { tokenToRemove } = select(getState());
    if (!tokenToRemove) throw new Error('No token.');

    const { uid: tokenUid } = tokenToRemove;

    const result = await app.functions().httpsCallable('removeUser')({ tokenUid });
    dispatch(generatedActions.setStudentManagerMode(STUDENT_MANAGER_MODE.LIST));
  }
);

const init = createAsyncThunk(
  `${name}/initSelectedCourse`,
  async (_, { dispatch }) => {
    app.auth().onAuthStateChanged((authUser) => {
      dispatch(generatedActions.reset());
    })
  }
);

const setValue = name => (state, action) => {
  state[name] = action.payload;
};

const { actions: generatedActions, reducer } = createSlice({
  name: 'selectedCourse',
  initialState,
  reducers: {
    // _setUid: setValue('uid'),
    setTokens: setValue('tokens'),
    setCourse: setValue('course'),
    setCourseCreator: setValue('courseCreator'),
    setCourseCreatorProvider: setValue('courseCreatorProvider'),
    setCourseCreatorImageUrl: setValue('courseCreatorImageUrl'),
    setStudent: setValue('student'),
    setItems: setValue('items'),
    setSelectedItemUid: setValue('selectedItemUid'),
    setIsRecording: setValue('isRecording'),
    setIsFullscreen: setValue('isFullscreen'),
    setSidebarMode: (state, action) => {
      state.sidebarMode = action.payload;
      state.numOutstandingChats = 0;
    },
    setChat: setValue('chat'),
    addChatMessage: (state, action) => {
      state.chat = [ ...state.chat, action.payload ]
    },
    setChatMessage: setValue('chatMessage'),
    setNumOutstandingChats: setValue('numOutstandingChats'),
    addImageUrls: (state, action) => {
      state.imageUrls = { ...state.imageUrls, ...action.payload };
    },
    setParentCourse: setValue('parentCourse'),
    setParentItems: setValue('parentItems'),

    setAdminImageUrl: setValue('adminImageUrl'),
    reset: (state, action) => initialState,

    setEditMode: (state, action) => {
      state.editMode = action.payload;
      state.studentManagerMode = initialState.studentManagerMode;
      state.error = initialState.error;
    },
    setStudentManagerMode: (state, action) => {
      state.studentManagerMode = action.payload;
      state.error = initialState.error;
    },
    setEmailResult: setValue('emailResult'),
    resetEmailResult: resetValue('emailResult', initialState.emailResult),
    setCurrentToken: setValue('tokenToRemove'),
    resetCurrentToken: resetValue('tokenToRemove', initialState.studentToRemove)
  },
  extraReducers: loaderReducers(name, initialState)
});

const actions = {
  ...generatedActions, init, update,
  setLocation,
  submitChatMessage, searchForEmail,
  addUser, removeUser,
  purchaseCourse
};

const select = ({ selectedCourse }) => selectedCourse;
const selectOwnsCourse = createSelector(
  select,
  ({ course }) => {
    const currentUser = app.auth().currentUser;
    return !!(course && currentUser && (currentUser.uid === course.creatorUid));
  }
);
const selectHasAccess = createSelector(
  select,
  () => {}
);
const selectIsCreator = createSelector(select, ({ course }) => {
  return (app.auth().currentUser && course)
    ? app.auth().currentUser.uid === course.creatorUid
    : false;
})
const selectAdminTokens = createSelector(
  select,
  ({ tokens }) => tokens.filter(({ access }) => access === 'admin')
);
const selectStudentTokens = createSelector(
  select,
  ({ tokens }) => tokens.filter(({ access }) => access === 'student')
);
const selectChat = createSelector(select, ({ chat }) => chat);

// This only gets parent items, but replaces them with local items when they exist.
const selectParentItems = createSelector(select, ({ parentCourse, parentItems, items }) => {
  // Returns all parent items in an ordered array.
  if (!parentCourse) return [];
  return parentCourse.itemOrder.map((uid) => {
    const item = items[uid] || parentItems[uid];
    return item;
  }).filter(item => !!item);
});

// This only gets local items.
const selectItems = createSelector(select, ({ items, parentItems, course }) => {
  if (!course) return [];
  return course.itemOrder.map((uid) => {
    return items[uid];
  }).filter(item => !!item);
});

const selectAllItems = createSelector(
  selectParentItems,
  selectItems,
  (parentItems, items) => ([
    ...parentItems, ...items
  ])
);

const selectSelectedItem = createSelector(
  select,
  ({ items, parentItems, selectedItemUid }) => {
    console.log('select', items, selectedItemUid);
    return items[selectedItemUid] || parentItems[selectedItemUid];
  }
);

const selectors = {
  select, selectOwnsCourse, selectHasAccess, selectAdminTokens, selectStudentTokens, selectChat,
  selectIsCreator,
  selectItems, selectParentItems, selectAllItems, selectSelectedItem
};

export { actions, selectors };
export default reducer;
