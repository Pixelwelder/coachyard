import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import app from 'firebase/app';

/**
 * Provides the list of courses this user has access to.
 */
const initialState = {
  teaching: {},
  learning: {}
};

let userListener = () => {};
let courseListener = () => {};
const init = createAsyncThunk(
  'initCatalog',
  async (_, { dispatch }) => {
    app.auth().onAuthStateChanged((authUser) => {
      userListener();
      courseListener();

      if (authUser) {
        const { uid } = authUser;

        // Listen for enrolled courses.
        userListener = app.firestore()
          .collection('users')
          .doc(uid)
          .onSnapshot((snapshot) => {
            console.log('user snapshot (enrolled)');
            const { enrolled } = snapshot.data();
            console.log('enrolled', enrolled);
            dispatch(generatedActions.setLearning(enrolled));
          });

        courseListener = app.firestore()
          .collection('courses')
          .where('creatorUid', '==', uid)
          .onSnapshot((snapshot) => {
            console.log('course snapshot');
            const teaching = snapshot.docs.reduce((accum, doc) => ({
              ...accum,
              [doc.id]: doc.data()
            }), {});
            console.log('courses', teaching);
            dispatch(generatedActions.setTeaching(teaching));
          });
      }
    });
  }
);

const setValue = name => (state, action) => {
  state[name] = action.payload;
};

const { actions: generatedActions, reducer } = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    setTeaching: setValue('teaching'),
    setLearning: setValue('learning')
  },
  extraReducers: {}
});

const actions = { ...generatedActions, init };

const select = ({ catalog }) => catalog;
const selectors = { select };

export { actions, selectors };
export default reducer;
