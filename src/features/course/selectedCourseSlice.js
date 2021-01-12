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
  courseCreatorImageUrl: '',
  student: null,
  studentImageUrl: '',
  items: [],
  selectedItem: null,
  selectedItemUid: null,

  adminImageUrl: '',
  studentImageUrls: []
};

const _loadItems = createAsyncThunk(
  'selectedCourse/loadItems',
  async ({ uid }) => {

  }
);

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
    const slice = selectors.select(getState());
    const { course } = slice;
    if (course && (course.uid === uid)) {
      return;
    }

    dispatch(generatedActions._setSelectedItemUid(null));
    dispatch(generatedActions._setSelectedItem(null));

    const abandon = () => {
      history.push('/dashboard');
      return;
    };

    // We check for a token when the UID is set, but we don't subscribe.
    // TODO Ensure we only have one.
    const tokenDocs = await app.firestore()
      .collection('tokens')
      .where('user', '==', app.auth().currentUser.uid)
      .where('courseUid', '==', uid)
      .get();

    if (!tokenDocs.size) abandon();

    // If there's a token, grab the course and items it refers to.
    unsubscribeCourse();
    unsubscribeCourse = app.firestore()
      .collection('courses')
      .where('uid', '==', uid)
      .onSnapshot(async (snapshot) => {
        dispatch(generatedActions.reset());

        console.log('snapshot size', snapshot.size);
        if (!snapshot.size) abandon();
        console.log('received course', snapshot.docs[0].data())

        const course = parseUnserializables(snapshot.docs[0].data());
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
    setCourseCreatorImageUrl: setValue('courseCreatorImageUrl'),
    setStudent: setValue('student'),
    setStudentImageUrl: setValue('studentImageUrl'),
    setItems: setValue('items'),
    _setSelectedItemUid: setValue('selectedItemUid'),
    _setSelectedItem: setValue('selectedItem'),
    setIsRecording: setValue('isRecording'),
    setIsFullscreen: setValue('isFullscreen'),

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
