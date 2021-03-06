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
  courseCreatorImageUrl: '',
  student: null,
  items: [],
  selectedItem: null,
  selectedItemUid: null,

  adminImageUrl: '',

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

let unsubscribeCourse = () => {};
let unsubscribeToken = () => {};
let unsubscribeItems = () => {};
let unsubscribeCreator = () => {};
let unsubscribeStudent = () => {};
let unsubscribeStudentTokens = () => {};
let unsubscribeChat = () => {};
/**
 * Sets the selected course.
 * This loads the course and its items.
 * @param id - the id of the course to load.
 */
const setUid = createAsyncThunk(
  `${name}/setUid`,
  async ({ uid, history }, { dispatch, getState }) => {
    app.analytics().logEvent(EventTypes.SELECT_COURSE, { uid });
    const { course } = selectors.select(getState());
    if (course?.uid === uid) {
      return;
    }

    dispatch(generatedActions._setSelectedItemUid(null));
    dispatch(generatedActions._setSelectedItem(null));

    const abandon = () => {
      // history.push('/dashboard');
    };

    // We check for a token when the UID is set, but we don't subscribe.
    // TODO Ensure we only have one.
    // const tokenDocs = await app.firestore()
    //   .collection('tokens')
    //   .where('user', '==', app.auth().currentUser.uid)
    //   .where('courseUid', '==', uid)
    //   .get();
    //
    // if (!tokenDocs.size) return abandon();

    // If there's a token, grab the course and items it refers to.
    unsubscribeCourse();
    unsubscribeCourse = app.firestore()
      .collection('courses')
      .doc(uid)
      .onSnapshot(async (snapshot) => {
        dispatch(generatedActions.reset());
        if (!snapshot.exists) {
          // If there's no course, just return.
          history.push('/dashboard');
          return;
        }
        const courseDoc = snapshot;
        const course = parseUnserializables(courseDoc.data());
        dispatch(generatedActions.setCourse(course));

        // Get the creator.
        unsubscribeCreator();
        unsubscribeCreator = app.firestore()
          .collection('users')
          .doc(course.creatorUid)
          .onSnapshot(async (snapshot) => {
            console.log('got creator', snapshot.data());
            const creator = parseUnserializables(snapshot.data());
            dispatch(generatedActions.setCourseCreator(creator));

            const url = await app.storage().ref(`/avatars/${course.creatorUid}.png`).getDownloadURL();
            dispatch(generatedActions.setCourseCreatorImageUrl(url));
          });

        // Get all tokens.
        unsubscribeStudentTokens();
        unsubscribeStudentTokens = app.firestore().collection('tokens')
          .where('courseUid', '==', course.uid)
          .onSnapshot(async (snapshot) => {
            if (snapshot.size) {
              const tokens = snapshot.docs.map(doc => parseUnserializables(doc.data()));
              dispatch(generatedActions.setTokens(tokens));

              // Now images
              // TODO This should be universal.
              const { imageUrls } = select(getState());
              const uids = tokens.map(({ user }) => user).filter(uid => !imageUrls[uid]);
              const promises = uids.map(async (uid) => {
                try {
                  const url = await app.storage().ref(`/avatars/${uid}.png`).getDownloadURL();
                  console.log('uid', uid, url);
                  return { uid, url };
                } catch (error) {
                  return { uid, url: '' };
                }
              });
              const result = await Promise.all(promises);
              const urls = result.reduce((accum, { uid, url }) => ({
                ...accum,
                [uid]: url
              }), {});
              dispatch(generatedActions.addImageUrls(urls));
            }
          });

        // Get chat, then subscribe for more.
        // const chatRef = courseDoc.ref.collection('chat');
        // const existingChat = await chatRef.get();
        // const chatMessages = existingChat.docs.map(doc => parseUnserializables(doc.data()));
        // dispatch(generatedActions.setChat(chatMessages));

        unsubscribeChat();
        unsubscribeChat = courseDoc.ref.collection('chat')
          .orderBy('created')
          // .limit(1)
          .onSnapshot((snapshot) => {
            const messages = snapshot.docs.map(doc => parseUnserializables(doc.data()));

            const { numOutstandingChats, sidebarMode, chat } = select(getState());
            if (sidebarMode === SIDEBAR_MODES.TOC) {
              const diff = messages.length - chat.length;
              dispatch(generatedActions.setNumOutstandingChats(numOutstandingChats + diff));
            }
            dispatch(generatedActions.setChat(messages));
          });
      });

    // Get the items.
    unsubscribeItems();
    unsubscribeItems = app.firestore()
      .collection('items')
      .where('courseUid', '==', uid)
      .orderBy('created')
      .onSnapshot((snapshot) => {
        console.log('received', snapshot.size, 'items');
        const items = snapshot.docs.map(item => parseUnserializables(item.data()));
        dispatch(generatedActions.setItems(items));
      });
  }
);

let unsubscribeItem = () => {};
const setSelectedItemUid = createAsyncThunk(
  `${name}/setSelectedItemUid`,
  async ({ uid, history }, { dispatch, getState }) => {
    const { selectedItem } = selectors.select(getState());
    if (selectedItem && selectedItem.uid === uid) {
      console.log(`item uid ${uid} is unchanged`);
      return;
    }

    app.analytics().logEvent(EventTypes.SELECT_ITEM, { uid });
    unsubscribeItem();

    if (uid) {
      unsubscribeItem = app.firestore()
        .collection('items')
        .doc(uid)
        .onSnapshot((snapshot) => {
          if (snapshot.exists) {
            const data = parseUnserializables(snapshot.data());
            dispatch(generatedActions._setSelectedItemUid(data.uid));
            dispatch(generatedActions._setSelectedItem(data));
          } else {
            dispatch(generatedActions._setSelectedItemUid(null));
            dispatch(generatedActions._setSelectedItem(null));
          }
        });
    } else {
      dispatch(generatedActions._setSelectedItemUid(null));
      dispatch(generatedActions._setSelectedItem(null));
    }
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
  async (_, { getState, dispatch }) => {
    try {
      const { uid } = app.auth().currentUser;
      const state = getState();
      const { chatMessage, course } = select(state);
      dispatch(generatedActions.setChatMessage(''));
      await app.firestore().collection('courses')
        .doc(course.uid)
        .collection('chat')
        .doc()
        .set({
          sender: uid,
          text: chatMessage,
          created: app.firestore.Timestamp.now()
        });
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

    console.log('user', email, result.size);
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

      console.log('found user', user);
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

    console.log('addUser', studentEmail, courseUid);
    const result = await app.functions().httpsCallable('addUser')({ studentEmail, courseUid });
    console.log('addUser result', result);
    dispatch(generatedActions.resetEmailResult());
    dispatch(generatedActions.setStudentManagerMode(STUDENT_MANAGER_MODE.LIST));
  }
);

const purchaseCourse = createAsyncThunk(
  `${name}/purchase`,
  async (_, { getState }) => {
    const { course: { uid: courseUid } } = select(getState());
    const result = await app.functions().httpsCallable('purchaseCourse')({ courseUid });
  }
);

const removeUser = createAsyncThunk(
  `${name}/removeUser`,
  async (_, { getState, dispatch }) => {
    const { tokenToRemove } = select(getState());
    console.log('removeUser', tokenToRemove);
    if (!tokenToRemove) throw new Error('No token.');

    const { uid: tokenUid } = tokenToRemove;

    console.log('removeUser', tokenUid);
    const result = await app.functions().httpsCallable('removeUser')({ tokenUid });
    console.log('removeUser', result);
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

const onPending = (state) => {
  state.error = initialState.error;
  state.isLoading = true;
};

const onRejected = (state, action) => {
  state.error = action.error;
  state.isLoading = false;
};

const onFulfilled = (state) => {
  state.isLoading = false;
};

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
    setCourseCreatorImageUrl: setValue('courseCreatorImageUrl'),
    setStudent: setValue('student'),
    setItems: setValue('items'),
    _setSelectedItemUid: setValue('selectedItemUid'),
    _setSelectedItem: setValue('selectedItem'),
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
  setUid, setSelectedItemUid,
  submitChatMessage, searchForEmail,
  addUser, removeUser,
  purchaseCourse
};

const select = ({ selectedCourse }) => selectedCourse;
const selectSelectedItem = createSelector(
  select,
  ({ selectedItem }) => selectedItem
);
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
const selectAdminTokens = createSelector(
  select,
  ({ tokens }) => tokens.filter(({ access }) => access === 'admin')
);
const selectStudentTokens = createSelector(
  select,
  ({ tokens }) => tokens.filter(({ access }) => access === 'student')
);
const selectors = {
  select, selectSelectedItem, selectOwnsCourse, selectHasAccess, selectAdminTokens, selectStudentTokens
};

export { actions, selectors };
export default reducer;
