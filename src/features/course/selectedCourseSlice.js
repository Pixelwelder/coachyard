import app from 'firebase/app';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { parseUnserializables } from '../../util/firestoreUtils';
import { EventTypes } from '../../constants/analytics';
import { loaderReducers, resetValue, setValue } from '../../util/reduxUtils';
import { CALLABLE_FUNCTIONS } from '../../app/callableFunctions';

export const SIDEBAR_MODES = {
  TOC: 0,
  CHAT: 1,
};

export const STUDENT_MANAGER_MODE = {
  LIST: 0,
  ADD: 1,
  DELETE: 2,
  VIEW_USER: 3,
  EDIT_INVITE: 4,
};

export const EDIT_MODE = {
  DETAILS: 0,
  ACCESS: 1,
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
  attachments: [],

  chat: [],
  chatMessage: '',
  numOutstandingChats: 0,

  courseIsLoaded: false,

  imageUrls: {},

  sidebarMode: SIDEBAR_MODES.TOC,
  editMode: EDIT_MODE.DETAILS,

  studentManagerMode: STUDENT_MANAGER_MODE.LIST,
  emailResult: null,
  currentToken: null,

  // Purchases in process.
  sessions: [],

  // Descendants
  descendantTokens: [],
};

const select = ({ selectedCourse }) => selectedCourse;
const selectOwnsCourse = createSelector(
  select,
  ({ course }) => {
    const { currentUser } = app.auth();
    return !!(course && currentUser && (currentUser.uid === course.creatorUid));
  },
);
const selectHasAccess = createSelector(
  select,
  () => {},
);
const selectIsCreator = createSelector(select, ({ course }) => ((app.auth().currentUser && course)
  ? app.auth().currentUser.uid === course.creatorUid
  : false));
const selectAdminTokens = createSelector(
  select,
  ({ tokens }) => tokens.filter(({ access }) => access === 'admin'),
);
const selectStudentTokens = createSelector(
  select,
  ({ tokens }) => tokens.filter(({ access }) => access === 'student'),
);
const selectChat = createSelector(select, ({ chat }) => chat);

// This only gets parent items, but replaces them with local items when they exist.
const selectParentItems = createSelector(select, ({ parentCourse, parentItems }) => {
  // Returns all parent items in an ordered array.
  if (!parentCourse) return [];
  return parentCourse.itemOrder.map(uid => parentItems[uid]).filter(item => !!item);
});

// This only gets local items.
const selectItems = createSelector(select, ({ items, course }) => {
  if (!course) return [];
  const { itemOrder, localItemOrder } = course;

  return [...itemOrder, ...localItemOrder]
    .map(uid => items[uid])
    .filter(item => !!item);
  // .sort((a, b) => {});
});

// This gets all items.
const selectAllItems = createSelector(
  selectParentItems,
  selectItems,
  (parentItems, items) => [
    ...parentItems, ...items,
  ],
);

// This gets the actual combination of local and parent items that makes up the course.
const selectCourseItems = createSelector(
  selectItems,
  selectParentItems,
  () => ([]),
);

const selectSelectedItem = createSelector(
  select,
  ({ items, parentItems, selectedItemUid }) => items[selectedItemUid] || parentItems[selectedItemUid],
);

// TODO This could result in double billing, but that's probably better than no billing.
const selectIsBeingPurchased = createSelector(
  select,
  // ({ sessions }) => sessions.find(session => session.session.payment_status === 'unpaid')
  () => false
);

const selectOwnsDescendant = createSelector(
  select,
  ({ descendantTokens }) => !!descendantTokens.length,
);

const selectOwnedDescendant = createSelector(
  select,
  ({ descendantTokens }) => (descendantTokens.length ? descendantTokens[0] : null),
);

const selectors = {
  select,
  selectOwnsCourse,
  selectHasAccess,
  selectAdminTokens,
  selectStudentTokens,
  selectChat,
  selectIsCreator,
  selectItems,
  selectParentItems,
  selectAllItems,
  selectCourseItems,
  selectSelectedItem,
  selectIsBeingPurchased,
  selectOwnsDescendant,
  selectOwnedDescendant,
};

const { actions: generatedActions, reducer } = createSlice({
  name: 'selectedCourse',
  initialState,
  reducers: {
    // _setUid: setValue('uid'),
    setToken: setValue('token'),
    setTokens: setValue('tokens'),
    setCourse: setValue('course'),
    setCourseCreator: setValue('courseCreator'),
    setCourseCreatorProvider: setValue('courseCreatorProvider'),
    setCourseCreatorImageUrl: setValue('courseCreatorImageUrl'),
    setStudent: setValue('student'),
    setItems: setValue('items'),
    setSelectedItemUid: setValue('selectedItemUid'),
    setAttachments: setValue('attachments'),
    setIsRecording: setValue('isRecording'),
    setIsFullscreen: setValue('isFullscreen'),
    setSidebarMode: (state, action) => {
      state.sidebarMode = action.payload;
      state.numOutstandingChats = 0;
    },
    setChat: setValue('chat'),
    addChatMessage: (state, action) => {
      state.chat = [...state.chat, action.payload];
    },
    setChatMessage: setValue('chatMessage'),
    setNumOutstandingChats: setValue('numOutstandingChats'),
    addImageUrls: (state, action) => {
      state.imageUrls = { ...state.imageUrls, ...action.payload };
    },
    setParentCourse: setValue('parentCourse'),
    setParentItems: setValue('parentItems'),

    setAdminImageUrl: setValue('adminImageUrl'),
    reset: () => initialState,

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
    resetCurrentToken: resetValue('tokenToRemove', initialState.studentToRemove),

    setSessions: setValue('sessions'),
    setDescendantTokens: setValue('descendantTokens'),
  },
  extraReducers: loaderReducers(name, initialState),
});

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

/**
 * Parses a snapshot of items into an equivalent array in the same order.
 *
 * @param snapshot
 * @returns the items in an array
 */
const parseItemsArr = (snapshot) => snapshot.docs.map(item => parseUnserializables(item.data()))

let unsubscribeCourse = () => {};
let unsubscribeLocalItems = () => {};
let unsubscribeParentCourse = () => {};
let unsubscribeParentItems = () => {};
let unsubscribeCreator = () => {};
let unsubscribeCreatorProvider = () => {};
let unsubscribeStudentTokens = () => {};
let unsubscribeChat = () => {};
let unsubscribeSessions = () => {};
let unsubscribeDescendants = () => {};
let unsubscribeAttachments = () => {};

const unsubscribe = () => {
  unsubscribeCourse();
  unsubscribeCreator();
  unsubscribeCreatorProvider();
  unsubscribeLocalItems();
  unsubscribeParentCourse();
  unsubscribeParentItems();
  unsubscribeStudentTokens();
  unsubscribeChat();
  unsubscribeSessions();
  unsubscribeDescendants();
  unsubscribeAttachments();
};

const setSelectedItemUid = createAsyncThunk(
  `${name}/setSelectedItemUid`,
  async (itemUid, { dispatch, getState }) => {
    const { course } = select(getState());

    console.log('setSelectedItemUid', itemUid, course.uid);
    dispatch(generatedActions.setSelectedItemUid(itemUid));
    unsubscribeAttachments();
    unsubscribeAttachments = app.firestore()
      .collection('courses').doc(course.uid)
      .collection('items').doc(itemUid)
      .collection('attachments')
      .onSnapshot((snapshot) => {
        const attachments = parseItemsArr(snapshot);
        dispatch(generatedActions.setAttachments(attachments));
      });
  }
);

const setLocation = createAsyncThunk(
  `${name}/setLocation`,
  async ({ courseUid, itemUid, history }, { dispatch, getState }) => {
    app.analytics().logEvent(EventTypes.SELECT_COURSE_AND_ITEM, { courseUid, itemUid });

    const reset = () => {
      dispatch(generatedActions.reset());
      unsubscribe();
    };

    const abandon = (message) => {
      // eslint-disable-next-line no-console
      if (message) console.error(message);
      reset();
      history.push('/dashboard');
    };

    if (!courseUid) abandon('No courseUid.');

    const state = select(getState());

    // Do we have a course loaded?
    const { course: currentCourse } = state;
    if (currentCourse) {
      // We have a course. Is it the same one?
      if (currentCourse.uid === courseUid) {
        // Do not load; just set the selected item.
        if (itemUid) {
          // That means the item should exist.
          const { items, parentItems } = state;
          if (items[itemUid] || parentItems[itemUid]) {
            // This is valid. Go ahead and set it.
            dispatch(setSelectedItemUid(itemUid));
            return;
          }
          // This is invalid. Call setLocation again, but with a null itemUid.
          history.push(`/course/${courseUid}`);
          return;
        }
        dispatch(setSelectedItemUid(initialState.selectedItemUid));
        return;
      }
    }

    // Proceed.
    reset();

    // If we've made it this far, we are definitely loading a course OR returning to dashboard.
    // Load the course or die.
    const courseRef = app.firestore().collection('courses').doc(courseUid);
    const courseDoc = await courseRef.get();
    if (!courseDoc.exists) {
      abandon(`Course ${courseUid} doesn't exist.`);
      return;
    }

    // The course exists, but does this user have access to it?
    const course = parseUnserializables(courseDoc.data());
    if (course.type === 'basic') {
      // Only public and accessible course.
      if (!course.isPublic) {
        if (!app.auth().currentUser) abandon('This channel is private and the user is not logged in.');

        const tokenDocs = await app.firestore().collection('tokens')
          .where('courseUid', '==', courseUid)
          .where('user', '==', app.auth().currentUser.uid)
          .get();

        if (!tokenDocs.size) {
          abandon('User does not have access to this course.');
          return;
        }

        if (tokenDocs.size > 1) throw new Error(`${tokenDocs.size} tokens found for course.`);
        dispatch(generatedActions.setToken(parseUnserializables(tokenDocs.docs[0].data())));
      }
    }

    // Go ahead and set the course, even though we'll be listening to it later.
    dispatch(generatedActions.setCourse(course));

    // We can also set the itemUid, though a later load failure will still abandon us to the dashboard.
    dispatch(setSelectedItemUid(itemUid));

    // Now grab all items. TODO This could be more elegant.
    // This will run twice: once after each item collection load.
    let localItems;
    let parentItems;
    const checkItemUid = (uid) => {
      if (!itemUid) return; // Don't care if we didn't get an itemUid at all.
      if (!localItems || !parentItems) return;
      if (!localItems[uid] && !parentItems[uid]) abandon(`Invalid itemUid ${uid}.`);
    };

    // Grab the items.
    unsubscribeLocalItems = courseRef.collection('items')
      .onSnapshot((snapshot) => {
        localItems = parseItems(snapshot);
        checkItemUid(itemUid);
        dispatch(generatedActions.setItems(localItems));
      });

    // Grab the parent.
    if (course.parent) {
      const parentRef = app.firestore().collection('courses').doc(course.parent);
      unsubscribeParentCourse = parentRef.onSnapshot((snapshot) => {
        if (snapshot.exists) {
          const parent = parseUnserializables(snapshot.data());
          dispatch(generatedActions.setParentCourse(parent));
        } else {
          abandon(`Course ${courseUid}'s parent ${course.parent} does not exist.`);
        }
      });

      // ...and _its_ items.
      unsubscribeParentItems = parentRef.collection('items').onSnapshot((snapshot) => {
        parentItems = parseItems(snapshot);
        checkItemUid(itemUid);
        dispatch(generatedActions.setParentItems(parentItems));
      });
    }

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

    // Get the chat.
    unsubscribeChat = courseRef.collection('chat')
      .orderBy('created')
      .onSnapshot((snapshot) => {
        const messages = snapshot.docs.map(doc => parseUnserializables(doc.data()));
        dispatch(generatedActions.setChat(messages));
        // TODO Outstanding messages.
      });

    // Get all access tokens - TODO if the user is admin.
    // TODO Is this necessary?
    unsubscribeStudentTokens = app.firestore().collection('tokens')
      .where('courseUid', '==', course.uid)
      .onSnapshot((snapshot) => {
        const tokens = snapshot.docs.map(doc => parseUnserializables(doc.data()));
        dispatch(generatedActions.setTokens(tokens));
      });

    // And finally, listen to future changes.
    unsubscribeCourse = app.firestore().collection('courses').doc(courseUid)
      .onSnapshot(async (snapshot) => {
        if (snapshot.exists) {
          // This course exists.
          const newCourse = parseUnserializables(snapshot.data());
          dispatch(generatedActions.setCourse(newCourse));
        } else {
          abandon(`Course ${courseUid} no longer exists.`);
        }
      });

    unsubscribeSessions = app.firestore()
      .collection('stripe_customers').doc(app.auth().currentUser.uid)
      .collection('sessions')
      .doc(courseUid)
      .collection('sessions')
      .onSnapshot((snapshot) => {
        if (snapshot.size) {
          const sessions = snapshot.docs.map(doc => parseUnserializables(doc.data()));
          dispatch(generatedActions.setSessions(sessions));
        }
      });

    unsubscribeDescendants = app.firestore().collection('tokens')
      .where('user', '==', app.auth().currentUser.uid)
      .where('parent', '==', courseUid)
      .where('access', '==', 'student')
      .onSnapshot((snapshot) => {
        if (snapshot.size) {
          const tokens = snapshot.docs.map(doc => parseUnserializables(doc.data()));
          dispatch(generatedActions.setDescendantTokens(tokens));
        }
      });
  },
);

const update = createAsyncThunk(
  `${name}/update`,
  async (_update, { getState }) => {
    const { course: { uid } } = select(getState());
    app.analytics().logEvent(EventTypes.UPDATE_COURSE_ATTEMPTED);
    const callable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.UPDATE_COURSE);
    await callable({ uid, update: _update });
    app.analytics().logEvent(EventTypes.UPDATE_COURSE);
  },
);

const submitChatMessage = createAsyncThunk(
  `${name}/submitChatMessage`,
  async ({ courseUid, message }, { dispatch }) => {
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
        created: app.firestore.Timestamp.now(),
      });
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
    dispatch(generatedActions.setStudentManagerMode(STUDENT_MANAGER_MODE.VIEW_USER));
  },
);

const addUser = createAsyncThunk(
  `${name}/addUser`,
  async (_, { getState, dispatch }) => {
    const { emailResult, course } = select(getState());
    if (!emailResult) throw new Error('No email.');
    if (!course) throw new Error('No course.');

    const studentEmail = typeof emailResult === 'object' ? emailResult.email : emailResult;
    const { uid: courseUid } = course;

    await app.functions().httpsCallable('addUser')({ studentEmail, courseUid });
    dispatch(generatedActions.resetEmailResult());
    dispatch(generatedActions.setStudentManagerMode(STUDENT_MANAGER_MODE.LIST));
  },
);

// TODO Duplicate
const purchaseCourse = createAsyncThunk(
  `${name}/purchase`,
  async (_, { getState }) => {
    const { course: { uid: courseUid } } = select(getState());
    const { data: newCourse } = await app.functions().httpsCallable('purchaseCourse')({
      courseUid,
      studentUid: app.auth().currentUser.uid,
    });
    return newCourse;
  },
);

const removeUser = createAsyncThunk(
  `${name}/removeUser`,
  async (_, { getState, dispatch }) => {
    const { tokenToRemove } = select(getState());
    if (!tokenToRemove) throw new Error('No token.');

    const { uid: tokenUid } = tokenToRemove;

    await app.functions().httpsCallable('removeUser')({ tokenUid });
    dispatch(generatedActions.setStudentManagerMode(STUDENT_MANAGER_MODE.LIST));
  },
);

const addAttachment = createAsyncThunk(
  `${name}/addAttachment`,
  async ({ itemUid, displayName, description, file }) => {

  }
)

const updateAttachment = createAsyncThunk(
  `${name}/updateAttachment`,
  async ({ attachment, file }, { getState }) => {
    const { course, selectedItemUid } = select(getState());
    const result = await app.firestore()
      .collection('courses').doc(course.uid)
      .collection('items').doc(selectedItemUid)
      .collection('attachments').doc(attachment.uid)
      .update(attachment);

    console.log('uploading attachment', file)
    const ref = app.storage().ref().child(`/attachments/${attachment.uid}`);
    await ref.put(file);
    console.log('attachment uploaded');
  }
)

const init = createAsyncThunk(
  `${name}/initSelectedCourse`,
  async (_, { dispatch }) => {
    app.auth().onAuthStateChanged(() => {
      dispatch(generatedActions.reset());
    });
  },
);

const actions = {
  ...generatedActions,
  init,
  update,
  setLocation,
  submitChatMessage,
  searchForEmail,
  addUser,
  removeUser,
  purchaseCourse,
  updateAttachment
};

export { actions, selectors };
export default reducer;
