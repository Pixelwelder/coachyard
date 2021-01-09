import app from 'firebase/app';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { parseUnserializables } from '../../util/firestoreUtils';

const initialState = {
  isLoading: false,
  error: null,

  isRecording: false,
  isFullscreen: false,

  course: null,
  courseCreator: null,
  student: null,
  items: [],
  selectedItem: null,
  selectedItemUid: null
};

let unsubscribeCourse = () => {};
let unsubscribeToken = () => {};
let unsubscribeItems = () => {};
let unsubscribeCreator = () => {};
let unsubscribeStudent = () => {};
/**
 * Sets the selected course.
 * This loads the course and its items.
 * @param id - the id of the course to load.
 */
const setUid = createAsyncThunk(
  'setUid',
  async ({ uid, history }, { dispatch, getState }) => {
    const { course } = selectors.select(getState());
    if (course && (course.uid === uid)) {
      return;
    }

    dispatch(generatedActions._setSelectedItemUid(null));
    dispatch(generatedActions._setSelectedItem(null));

    unsubscribeCourse();
    unsubscribeCreator();
    unsubscribeStudent();
    unsubscribeToken();

    const abandon = () => {
      history.push('/dashboard');
      return;
    };

    unsubscribeToken = app.firestore()
      .collection('tokens')
      .where('user', '==', app.auth().currentUser.uid)
      .where('courseUid', '==', uid)
      .onSnapshot((snapshot) => {
        console.log('Found', snapshot.size, 'tokens');
        if (!snapshot.size) {
          return abandon();
        }
      });

    unsubscribeCourse = app.firestore()
      .collection('courses')
      .where('uid', '==', uid)
      .onSnapshot(async (snapshot) => {
        dispatch(generatedActions.reset());

        if (!snapshot.size) abandon();

        const tokens = await app.firestore().collection('tokens')
          .where('user', '==', app.auth().currentUser.uid)
          .where('courseUid', '==', uid)
          .get();

        // TODO Ensure there's only one.
        if (!tokens.size) abandon();

        const course = parseUnserializables(snapshot.docs[0].data());
        dispatch(generatedActions.setCourse(course));

        unsubscribeCreator = await app.firestore()
          .collection('users')
          .doc(course.creatorUid)
          .onSnapshot((snapshot) => {
            const creator = parseUnserializables(snapshot.data());
            dispatch(generatedActions.setCourseCreator(creator));
          });

        if (course.student) {
          unsubscribeStudent = await app.firestore()
            .collection('users')
            .doc(course.student)
            .onSnapshot((snapshot) => {
              dispatch(generatedActions.setStudent(
                snapshot.exists ? parseUnserializables(snapshot.data()) : null
              ));
            });
        }
      });

    unsubscribeItems();
    unsubscribeItems = await app.firestore()
      .collection('items')
      .where('courseUid', '==', uid)
      .orderBy('created')
      .onSnapshot((snapshot) => {
        const items = snapshot.docs.map(item => parseUnserializables(item.data()));
        dispatch(generatedActions.setItems(items));
      });
  }
);

let unsubscribeItem = () => {};
const setSelectedItemUid = createAsyncThunk(
  'setSelectedItemUid',
  async ({ uid, history }, { dispatch, getState }) => {
    const { selectedItem } = selectors.select(getState());
    if (selectedItem && selectedItem.uid === uid) {
      console.log(`item uid ${uid} is unchanged`);
      return;
    }

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

const init = createAsyncThunk(
  'initSelectedCourse',
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
    setCourse: setValue('course'),
    setCourseCreator: setValue('courseCreator'),
    setStudent: setValue('student'),
    setItems: setValue('items'),
    _setSelectedItemUid: setValue('selectedItemUid'),
    _setSelectedItem: setValue('selectedItem'),
    setIsRecording: setValue('isRecording'),
    setIsFullscreen: setValue('isFullscreen'),
    reset: (state, action) => initialState
  },
  extraReducers: {
    [setUid.pending]: onPending,
    [setUid.rejected]: onRejected,
    [setUid.fulfilled]: onFulfilled
  }
});

const actions = { ...generatedActions, init, setUid, setSelectedItemUid };

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
const selectors = { select, selectSelectedItem, selectOwnsCourse };

export { actions, selectors };
export default reducer;
