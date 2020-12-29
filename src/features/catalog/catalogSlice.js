import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import app from 'firebase/app';
import { CALLABLE_FUNCTIONS } from '../../app/callableFunctions';
import { parseUnserializables } from '../../util/firestoreUtils';
import { actions as uiActions, selectors as uiSelectors, MODES } from '../ui/uiSlice';

/**
 * Provides the list of courses this user has access to.
 */
const initialState = {
  teaching: {
    courses: {},
    isLoading: false,
    error: null
  },

  learning: {
    courses: {}
  }
};

let userListener = () => {};
let courseListener = () => {};
const init = createAsyncThunk(
  'initCatalog',
  async (_, { dispatch }) => {
    app.auth().onAuthStateChanged((authUser) => {
      userListener();
      courseListener();
      dispatch(generatedActions.resetLearning());
      dispatch(generatedActions.resetTeaching());

      if (authUser) {
        const { uid } = authUser;

        // Listen for enrolled courses.
        userListener = app.firestore()
          .collection('users')
          .doc(uid)
          .onSnapshot((snapshot) => {
            if (snapshot.exists) {
              console.log('user snapshot (enrolled)');
              const { enrolled: courses } = snapshot.data();
              console.log('enrolled', courses);
              dispatch(generatedActions.setLearning({ courses }));
            }
          });

        courseListener = app.firestore()
          .collection('courses')
          .where('creatorUid', '==', uid)
          .onSnapshot((snapshot) => {
            console.log('course snapshot');
            const courses = snapshot.docs.reduce((accum, doc) => ({
              ...accum,
              [doc.id]: parseUnserializables(doc.data())
            }), {});
            console.log('courses', courses);
            dispatch(generatedActions.setTeaching({ courses: courses }));
          });
      }
    });
  }
);

const createNewCourse = createAsyncThunk(
  'createNewCourse',
  async ({ displayName, email }, { dispatch, getState }) => {
    const callable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.CREATE_COURSE);
    const result = await callable({ displayName, description: '' });
  }
);

const deleteCourse = createAsyncThunk(
  'deleteCourse',
  async ({ uid }, { dispatch, getState }) => {
    console.log('deleting', uid);
    const { deleteDialog } = uiSelectors.select(getState());
    dispatch(uiActions.setUI({ deleteDialog: { ...deleteDialog, mode: MODES.DELETE }}));
    const callable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.DELETE_COURSE);

    try {
      await callable({ uid });
      dispatch(uiActions.resetUI('deleteDialog'));
    } catch (error) {
      dispatch(uiActions.setUI({ deleteDialog: { ...deleteDialog, error, mode: MODES.VIEW }}));
    }
  }
);

const onPending = name => (state) => {
  state[name].isLoading = true;
  state[name].error = null;
};

const onRejected = name => (state) => {
  state[name].isLoading = false;
  state[name].error = state.payload;
};

const onFulfilled = name => (state) => {
  state[name].isLoading = false;
};

const setValue = name => (state, action) => {
  state[name] = action.payload;
};

const resetValue = name => (state) => {
  state[name] = initialState[name];
};

const mergeValue = name => (state, action) => {
  state[name] = { ...state[name], ...action.payload };
};

const { actions: generatedActions, reducer } = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    setTeaching: mergeValue('teaching'),
    resetTeaching: resetValue('teaching'),

    setLearning: mergeValue('learning'),
    resetLearning: resetValue('learning')
  },
  extraReducers: {
    [createNewCourse.pending]: onPending('teaching'),
    [createNewCourse.rejected]: onRejected('teaching'),
    [createNewCourse.fulfilled]: onFulfilled('teaching'),

    [deleteCourse.pending]: onPending('teaching'),
    [deleteCourse.rejected]: onRejected('teaching'),
    [deleteCourse.fulfilled]: onFulfilled('teaching')
  }
});

const actions = {
  ...generatedActions,
  init,
  createNewCourse,
  deleteCourse
};

const select = ({ catalog }) => catalog;
const selectTeaching = createSelector(select, ({ teaching }) => teaching);
const selectTeachingCourses = createSelector(
  selectTeaching,
  ({ courses }) => Object.values(courses)
);
const selectLearning = createSelector(select, ({ learning }) => learning);
const selectors = { select, selectLearning, selectTeaching, selectTeachingCourses };

export { actions, selectors };
export default reducer;
