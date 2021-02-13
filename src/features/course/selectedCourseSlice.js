import app from 'firebase/app';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { parseUnserializables } from '../../util/firestoreUtils';
import { EventTypes } from '../../constants/analytics';

export const SIDEBAR_MODES = {
  TOC: 0,
  CHAT: 1
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
  studentImageUrl: '',
  items: [],
  selectedItem: null,
  selectedItemUid: null,

  adminImageUrl: '',
  studentImageUrls: [],

  chat: [],
  chatMessage: '',

  sidebarMode: SIDEBAR_MODES.CHAT
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
    const slice = selectors.select(getState());
    const { course } = slice;
    if (course && (course.uid === uid)) {
      return;
    }

    dispatch(generatedActions._setSelectedItemUid(null));
    dispatch(generatedActions._setSelectedItem(null));

    const abandon = () => {
      history.push('/dashboard');
    };

    // We check for a token when the UID is set, but we don't subscribe.
    // TODO Ensure we only have one.
    const tokenDocs = await app.firestore()
      .collection('tokens')
      .where('user', '==', app.auth().currentUser.uid)
      .where('courseUid', '==', uid)
      .get();

    if (!tokenDocs.size) return abandon();

    // If there's a token, grab the course and items it refers to.
    unsubscribeCourse();
    unsubscribeCourse = app.firestore()
      .collection('courses')
      .where('uid', '==', uid)
      .onSnapshot(async (snapshot) => {
        dispatch(generatedActions.reset());

        console.log('snapshot size', snapshot.size);
        if (!snapshot.size) return abandon();
        const courseDoc = snapshot.docs[0];
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
          .onSnapshot((snapshot) => {
            if (snapshot.size) {
              const tokens = snapshot.docs.map(doc => parseUnserializables(doc.data()));
              dispatch(generatedActions.setTokens(tokens));
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
            console.log('CHAT', snapshot.size);
            const messages = snapshot.docs.map(doc => parseUnserializables(doc.data()));
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
    setStudentImageUrl: setValue('studentImageUrl'),
    setItems: setValue('items'),
    _setSelectedItemUid: setValue('selectedItemUid'),
    _setSelectedItem: setValue('selectedItem'),
    setIsRecording: setValue('isRecording'),
    setIsFullscreen: setValue('isFullscreen'),
    setSidebarMode: setValue('sidebarMode'),
    setChat: setValue('chat'),
    addChatMessage: (state, action) => {
      state.chat = [ ...state.chat, action.payload ]
    },
    setChatMessage: setValue('chatMessage'),

    setAdminImageUrl: setValue('adminImageUrl'),
    setStudentImageUrls: setValue('studentImageUrls'),
    reset: (state, action) => initialState
  },
  extraReducers: {
    [setUid.pending]: onPending,
    [setUid.rejected]: onRejected,
    [setUid.fulfilled]: onFulfilled
  }
});

const actions = { ...generatedActions, init, setUid, setSelectedItemUid, submitChatMessage };

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
const selectAdminTokens = createSelector(
  select,
  ({ tokens }) => tokens.filter(({ access }) => access === 'admin')
);
const selectStudentTokens = createSelector(
  select,
  ({ tokens }) => tokens.filter(({ access }) => access === 'student')
);
const selectors = { select, selectSelectedItem, selectOwnsCourse, selectAdminTokens, selectStudentTokens };

export { actions, selectors };
export default reducer;
