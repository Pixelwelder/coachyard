import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import app from 'firebase/app';
import { mergeValue, reset, resetValue, setValue } from '../../util/reduxUtils';
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
  studentTokens: [],
  courses: [], // Created by this user

  selectedChatUid: null,
  selectedChat: [],
};

// TODO Lazy load.
let unsubscribeTokens = () => {};
let unsubscribeStudentTokens = () => {};
let unsubscribeCourses = () => {};
const init = createAsyncThunk(
  `${name}/init`,
  async (_, { dispatch }) => {
    app.auth().onAuthStateChanged((authUser) => {
      dispatch(generatedActions.clearStudentTokens());
      if (authUser) {
        unsubscribeTokens();
        unsubscribeTokens = app.firestore().collection('tokens')
          .where('creatorUid', '==', authUser.uid)
          .where('access', '==', 'admin') // necessary because creatorUid is on all
          .onSnapshot(async (snapshot) => {
            let tokens = [];
            if (snapshot.size) {
              tokens = snapshot.docs.map(doc => parseUnserializables(doc.data()));

              // Now go through all tokens and get up to two student tokens.
              const promises = tokens.map(async (token) => {
                const docRefs = await app.firestore().collection('tokens')
                  .where('access', '==', 'student')
                  .limit(2)
                  .get();
                const studentTokens = docRefs.docs.map(doc => parseUnserializables(doc.data()));
                dispatch(generatedActions.addStudentTokens({ [token.uid]: studentTokens }));
              });

              await Promise.all(promises);
            }
            dispatch(generatedActions.setTokens(tokens));
          });

        unsubscribeStudentTokens();
        unsubscribeStudentTokens = app.firestore().collection('tokens')
          .where('creatorUid', '==', authUser.uid)
          .where('access', '==', 'student')
          .onSnapshot(async (snapshot) => {
            let tokens = [];
            if (snapshot.size) {
              tokens = snapshot.docs.map(doc => parseUnserializables(doc.data()));
            }
            dispatch(generatedActions.setStudentTokens(tokens));
          });

        unsubscribeCourses();
        unsubscribeCourses = app.firestore().collection('courses')
          .where('creatorUid', '==', authUser.uid)
          .onSnapshot((snapshot) => {
            const courses = snapshot.docs.map(doc => parseUnserializables(doc.data()));
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
        const messages = snapshot.docs.map(doc => parseUnserializables(doc.data()));
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
    setStudentTokens: setValue('studentTokens'),
    addStudentTokens: mergeValue('studentTokensByCourseUid'),
    clearStudentTokens: resetValue('studentTokensByCourseUid', initialState.studentTokensByCourseUid),
    setCourses: setValue('courses'),
    setSelectedChatUid: setValue('selectedChatUid'),
    _setSelectedChat: setValue('selectedChat'),
    reset: reset(initialState),
  },
});

// TODO Duplicate code.
const createTypeFilter = type => ({ tokens }) => tokens.filter(token => token.type === type);
const createNegativeTypeFilter = type => ({ tokens }) => tokens.filter(token => token.type !== type);

const select = ({ dashboard }) => dashboard;
const selectTokens = createSelector(select, ({ tokens, studentTokens }) => ([ ...tokens, ...studentTokens ]));
const selectTemplateTokens = createSelector(select, createTypeFilter('template'));
const selectNonTemplateTokens = createSelector(select, ({ tokens }) => tokens.filter(({ access, type }) => access === 'admin' && type !== 'template'));
const selectTemplateCourses = createSelector(select, ({ courses }) => courses.filter(course => course.type === 'template'));
const selectNonTemplateCourses = createSelector(select, ({ courses }) => courses.filter(course => course.type !== 'template'));
const selectStudentTokensByCourseUid = createSelector(
  select,
  ({ studentTokens }) => studentTokens.reduce((accum, token) => {
    if (!accum[token.courseUid]) accum[token.courseUid] = [];
    accum[token.courseUid].push(token);
    return accum;
  }, {})
);
const selectStudentTokensByStudentUid = createSelector(
  select,
  ({ studentTokens }) => studentTokens.reduce((accum, studentToken) => {
    if (!accum[studentToken.user]) accum[studentToken.user] = [];
    accum[studentToken.user].push(studentToken);
    accum[studentToken.user].sort((a, b) => {
      if (a.displayName < b.displayName) return -1;
      if (a.displayName > b.displayName) return 1;
      return 0;
    });
    return accum;
  }, {})
)
const selectors = {
  select,
  selectStudentTokensByCourseUid,
  selectStudentTokensByStudentUid,
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
