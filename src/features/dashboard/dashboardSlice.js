import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { setValue } from '../../util/reduxUtils';
import app from 'firebase';
import { parseUnserializables } from '../../util/firestoreUtils';

export const TABS = {
  COURSES: 0,
  STUDENTS: 1,
  CHATS: 2,
  SCHEDULE: 3
}

const name = 'dashboard';
const initialState = {
  tab: TABS.STUDENTS,
  tokens: []
};

let unsubscribeTokens = () => {};
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
      }
    })
  }
);

const { reducer, actions: generatedActions } = createSlice({
  name,
  initialState,
  reducers: {
    setTab: setValue('tab'),
    setTokens: setValue('tokens')
  }
});

const select = ({ dashboard }) => dashboard;
const selectTokens = createSelector(select, ({ tokens }) => tokens);
const selectStudentTokens = createSelector(selectTokens, tokens => {
  return tokens.filter(token => token.access === 'student')
});
const selectors = { select, selectStudentTokens };

const actions = { ...generatedActions, init };

export { selectors, actions };
export default reducer;
