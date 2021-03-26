import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { setValue } from '../../util/reduxUtils';
import app from 'firebase';
import { parseUnserializables } from '../../util/firestoreUtils';
import { SIDEBAR_MODES } from '../course/selectedCourseSlice';

export const TABS = {
  COURSES: 0,
  STUDENTS: 1,
  CHATS: 2,
  SCHEDULE: 3
}

const name = 'dashboard';
const initialState = {
  tab: TABS.CHATS,
  tokens: [],
  courses: [], // Created by this user

  selectedChatUid: null,
  selectedChat: []
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
            if (snapshot.size) {
              const tokens = snapshot.docs.map(doc => parseUnserializables(doc.data()));
              dispatch(generatedActions.setTokens(tokens));
            }
          });

        unsubscribeCourses();
        unsubscribeCourses = app.firestore().collection('courses')
          .where('creatorUid', '==', authUser.uid)
          .onSnapshot((snapshot) => {
            const courses = snapshot.docs.map(doc => parseUnserializables(doc.data()));
            dispatch(generatedActions.setCourses(courses));
          })
      }
    })
  }
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
  }
)

const { reducer, actions: generatedActions } = createSlice({
  name,
  initialState,
  reducers: {
    setTab: setValue('tab'),
    setTokens: setValue('tokens'),
    setCourses: setValue('courses'),
    setSelectedChatUid: setValue('selectedChatUid'),
    _setSelectedChat: setValue('selectedChat')
  }
});

const select = ({ dashboard }) => dashboard;
const selectTokens = createSelector(select, ({ tokens }) => tokens);
const selectStudentTokens = createSelector(selectTokens, tokens => {
  return Object.values(
    tokens
      .filter(token => token.access === 'student')
      .reduce((accum, token) => {
        if (!accum[token.user]) accum[token.user] = [];
        accum[token.user].push(token);
        return accum;
      }, {})
  );
});
const selectors = { select, selectStudentTokens };

const actions = { ...generatedActions, init, setSelectedChat };

export { selectors, actions };
export default reducer;
