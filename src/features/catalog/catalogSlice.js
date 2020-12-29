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
    dispatch(uiActions.setUI({ deleteDialog: { ...deleteDialog, mode: MODES.PROCESSING }}));
    const callable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.DELETE_COURSE);

    try {
      await callable({ uid });
      dispatch(uiActions.resetUI('deleteDialog'));
    } catch (error) {
      dispatch(uiActions.setUI({ deleteDialog: { ...deleteDialog, error, mode: MODES.VIEW }}));
    }
  }
);

const _addItemToCourse = createAsyncThunk(
  '_addItemToCourse',
  async ({ item, courseUid }, { getState }) => {
    const callable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.ADD_ITEM_TO_COURSE);
    const { data } = await callable({ courseUid, item });
    console.log('item added', data);
    return data.item;
  }
);

const _uploadItem = createAsyncThunk(
  'updateItem',
  async ({ uid, file }, { dispatch, getState }) => new Promise((resolve, reject) => {
    console.log('_uploadItem', uid, file);
    const { newItemDialog } = uiSelectors.select(getState());
    dispatch(uiActions.setUI({ newItemDialog: { ...newItemDialog, mode: MODES.PROCESSING } }));

    // Upload the file to Firebase Storage.
    const storageRef = app.storage().ref(`raw`);
    const fileRef = storageRef.child(uid);
    const uploadTask = fileRef.put(file);

    // Monitor the task
    uploadTask.on('state_changed',
      (snapshot) => {
        const { bytesTransferred, totalBytes } = snapshot;
        dispatch(uiActions.setUI({
          newItemDialog: {
            ...newItemDialog,
            bytesTransferred,
            totalBytes
          }
        }));
      },
      (error) => {
        console.error(error.message);
        return reject(error);
      },
      async () => {
        // Now get a url for streaming service.
        console.log('upload complete', file);
        return resolve(fileRef.getDownloadURL());
      }
    );
  })
);

const _sendToStreamingService = createAsyncThunk(
  '_sendToStreamingService',
  async ({ uid, downloadUrl }) => {
    console.log('Sending to streaming service:', downloadUrl);
    const callable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.SEND_ITEM_TO_STREAMING_SERVICE);
    const streamResult = await callable({
      uid,
      params: { input: downloadUrl, playback_policy: ['public'] }
    });
    console.log('sent', streamResult);
  }
);

/**
 * Adds the current item to the course.
 *
 * @param courseUid - the course to add the item to
 * @param item - the item to add
 * @param file - the matching file to upload
 */
const addItemToCourse = createAsyncThunk(
  'addItemToCourse',
  async ({ courseUid, item, file }, { dispatch, getState }) => {
    const { newItemDialog } = uiSelectors.select(getState());

    try {
      // Create the data object.
      const { payload } = await dispatch(_addItemToCourse({ courseUid, item }));
      const { uid } = payload;

      // Upload the file if applicable.
      if (file) {
        // First, to Firebase Storage.
        console.log('uploading...');
        const uploadResult = await dispatch(_uploadItem({ uid, file }));
        const { payload: downloadUrl, error } = uploadResult;
        if (error) throw new Error(error.message);

        // Send to streaming service.
        await dispatch(_sendToStreamingService({ uid, downloadUrl }));
        console.log('addItemToCourse: complete');
      }
      // Reset UI.
      dispatch(uiActions.resetDialog('newItemDialog'));
    } catch (error) {
      dispatch(uiActions.setUI({
        newItemDialog: {
          ...newItemDialog,
          mode: MODES.VIEW,
          error: error.message
        }
      }))
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
    [deleteCourse.fulfilled]: onFulfilled('teaching'),

    [addItemToCourse.pending]: onPending('teaching'),
    [addItemToCourse.rejected]: onPending('teaching'),
    [addItemToCourse.fulfilled]: onPending('teaching')
  }
});

const actions = {
  ...generatedActions,
  init,
  createNewCourse, deleteCourse,
  addItemToCourse
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
