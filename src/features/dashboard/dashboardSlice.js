import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import app from 'firebase';
import { reset, setValue } from '../../util/reduxUtils';
import { parseUnserializables } from '../../util/firestoreUtils';

export const TABS = {
  COURSES: 0,
  STUDENTS: 1,
  CHATS: 2,
  SCHEDULE: 3,
};

const name = 'dashboard';
const initialState = {
  tab: TABS.COURSES,
  tokens: [],
  courses: [], // Created by this user

  selectedChatUid: null,
  selectedChat: [],
};

// TODO Lazy load.
let unsubscribeTokens = () => {};
let unsubscribeCourses = () => {};
const init = createAsyncThunk(
  `${name}/init`,
  async (_, { dispatch }) => {
    app.auth().onAuthStateChanged((authUser) => {
      if (authUser) {
        unsubscribeTokens();
        unsubscribeTokens = app.firestore().collection('tokens')
          .where('creatorUid', '==', authUser.uid)
          .onSnapshot((snapshot) => {
            let tokens = [];
            if (snapshot.size) {
              tokens = snapshot.docs.map((doc) => parseUnserializables(doc.data()));
            }
            dispatch(generatedActions.setTokens(tokens));
          });

        unsubscribeCourses();
        unsubscribeCourses = app.firestore().collection('courses')
          .where('creatorUid', '==', authUser.uid)
          .onSnapshot((snapshot) => {
            const courses = snapshot.docs.map((doc) => parseUnserializables(doc.data()));
            dispatch(generatedActions.setCourses(courses));
          });
      } else {
        console.log('dashboard.reset');
        dispatch(generatedActions.reset());
      }
    });
  },
);

let unsubscribeChat = () => {};
const setSelectedChat = createAsyncThunk(
  `${name}/setSelectedCourse`,
  ({ uid }, { dispatch, getState }) => {
    const { selectedChatUid } = select(getState());
    if (selectedChatUid === uid) return;

    dispatch(generatedActions.setSelectedChatUid(uid));
    dispatch(generatedActions._setSelectedChat(initialState.selectedChat));
    unsubscribeChat();
    unsubscribeChat = app.firestore().collection('courses')
      .doc(uid)
      .collection('chat')
      .orderBy('created')
      .onSnapshot((snapshot) => {
        const messages = snapshot.docs.map((doc) => parseUnserializables(doc.data()));
        dispatch(generatedActions._setSelectedChat(messages));
      });
  },
);

const clearChat = createAsyncThunk(
  `${name}/clearChat`,
  async (_, { getState }) => {
    const { selectedChatUid } = select(getState());
    const result = await app.functions().httpsCallable('clearChat')({ courseUid: selectedChatUid });
    console.log('chat cleared');
  },
);

const { reducer, actions: generatedActions } = createSlice({
  name,
  initialState,
  reducers: {
    setTab: setValue('tab'),
    setTokens: setValue('tokens'),
    setCourses: setValue('courses'),
    setSelectedChatUid: setValue('selectedChatUid'),
    _setSelectedChat: setValue('selectedChat'),
    reset: reset(initialState),
  },
});

// TODO Duplicate code.
const createTypeFilter = (type) => ({ tokens }) => tokens.filter((token) => token.type === type);
const createNegativeTypeFilter = (type) => ({ tokens }) => tokens.filter((token) => token.type !== type);

const select = ({ dashboard }) => dashboard;
const selectTokens = createSelector(select, ({ tokens }) => tokens);
const selectStudentTokens = createSelector(selectTokens, (tokens) => Object.values(
  tokens
    .filter((token) => token.access === 'student')
    .reduce((accum, token) => {
      if (!accum[token.user]) accum[token.user] = [];
      accum[token.user].push(token);
      return accum;
    }, {}),
));
const selectTemplateTokens = createSelector(select, createTypeFilter('template'));
const selectNonTemplateTokens = createSelector(select, ({ tokens }) => tokens.filter(({ access, type }) => access === 'admin' && type !== 'template'));
const selectTemplateCourses = createSelector(select, ({ courses }) => courses.filter((course) => course.type === 'template'));
const selectNonTemplateCourses = createSelector(select, ({ courses }) => courses.filter((course) => course.type !== 'template'));
const selectors = {
  select,
  selectStudentTokens,
  selectTemplateTokens,
  selectNonTemplateTokens,
  selectTemplateCourses,
  selectNonTemplateCourses,
};

const actions = {
  ...generatedActions, init, setSelectedChat, clearChat,
};

export { selectors, actions };
export default reducer;
