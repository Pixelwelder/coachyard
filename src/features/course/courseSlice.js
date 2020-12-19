import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { actions as logActions, createLog } from '../log/logSlice';
import app from 'firebase/app';
import { ERROR } from '../log/logTypes';
import { CALLABLE_FUNCTIONS } from '../../app/callableFunctions';

const initialState = {
  isLoading: false,
  video: null,
  items: [], // Assets. TODO.

  // All courses.
  createdCourses: [],

  // Actual loaded course.
  selectedCourse: '',
  selectedCourseData: null,
  selectedCourseItems: [],

  // UI
  newCourseIsOpen: false,
  newCourse: {
    displayName: '',
    description: ''
  },

  // UI
  newItemIsOpen: false,
  newItem: {
    displayName: '',
    description: '',
    file: ''
  },
  upload: {
    isUploading: false,
    bytesTransferred: 0,
    totalBytes: 0
  }
};

const fetchAssets = createAsyncThunk(
  'fetchAssets',
  async (_, { dispatch }) => {
    dispatch(logActions.log(createLog(`Fetching assets...` )));
    const assets = app.functions().httpsCallable(CALLABLE_FUNCTIONS.ASSETS);
    const result = await assets({ method: 'get' });
    console.log('fetchAssets', result);
    dispatch(logActions.log(createLog(`Fetched assets`)));
    return result;
  }
);

const fetchPlaybackId = createAsyncThunk(
  'fetchPlaybackIds',
  async ({ id }, { dispatch, getState }) => {
    const assets = app.functions().httpsCallable(CALLABLE_FUNCTIONS.ASSETS);
    try {
      const result = await assets({ method: 'post', id, endpoint: 'playback-ids' });
      console.log('fetchPlaybackIds', result);
    } catch (error) {
      console.error(error);
    }
    return {}
  }
);

// ------------------------------------------------------------------------------------
/**
 * Creates a course based on what's currently in the reducer, then reloads UI.
 */
const createCourse = createAsyncThunk(
  'createCourse',
  async (_, { dispatch, getState }) => {
    const { newCourse } = select(getState());
    const createCourseCallable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.CREATE_COURSE);
    const { data: { course } } = await createCourseCallable(newCourse);

    // Reset UI.
    dispatch(generatedActions.resetNewCourse());

    // Reload data.
    await dispatch(_getCreatedCourses());
    await dispatch(setAndLoadSelectedCourse(course.uid));
  }
);

/**
 * @internal - Does not set load or error states.
 */
const _getCurrentCourse = createAsyncThunk(
  'getCurrentCourse',
  async (_, { getState, dispatch }) => {
    // Load the current course.
    const { selectedCourse } = select(getState());
    const getCourse = app.functions().httpsCallable(CALLABLE_FUNCTIONS.GET_COURSE);
    const { data: { course, items } } = await getCourse({ uid: selectedCourse });

    console.log('getCurrentCourse', course);
    dispatch(generatedActions.setSelectedCourseData(course));
    dispatch(generatedActions.setSelectedCourseItems(items));
  }
);

/**
 * Reloads the current course. Public, so it updates load/error states.
 */
const reloadCurrentCourse = createAsyncThunk(
  'reloadCurrentCourse',
  async (_, { dispatch }) => {
    await dispatch(_getCurrentCourse());
  }
);

/**
 * Sets the currently selected course, then loads it.
 * @param selectedCourse - the uid of the course to set/load
 */
const setAndLoadSelectedCourse = createAsyncThunk(
  'setAndLoadSelectedCourse',
  async (selectedCourse, { dispatch }) => {
    console.log('setAndLoadSelectedCourse');
    dispatch(generatedActions.setSelectedCourse(selectedCourse));
    dispatch(_getCurrentCourse());
  }
);

// const giveCourse = createAsyncThunk(
//   'giveCourse',
//   async (params) => {
//     const giveCourseCallable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.GIVE_COURSE);
//     const result = await giveCourseCallable(params);
//     console.log('give course:', result);
//   }
// );

/**
 * @private - does not update load/error.
 */
const _deleteCourse = createAsyncThunk(
  'deleteCourse',
  async ({ uid }, { dispatch }) => {
    console.log('deleteCourse', uid);
    const callable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.DELETE_COURSE);
    const result = await callable({ uid });
    console.log('deleteCourse', result);
  }
);

/**
 * Deletes the currently selected course. No warning.
 * // TODO Add warning.
 */
const deleteSelectedCourse = createAsyncThunk(
  'deleteCurrentCourse',
  async (_, { getState, dispatch }) => {
    const { selectedCourse } = select(getState());
    console.log('deleteSelectedCourse', selectedCourse);
    await dispatch(_deleteCourse({ uid: selectedCourse }));

    // Reset UI.
    dispatch(generatedActions.resetSelectedCourse());

    // Reload courses.
    await dispatch(_getCreatedCourses());
  }
);

/**
 * Gets all courses created by a user.
 * @private - does not set load/error
 */
const _getCreatedCourses = createAsyncThunk(
  'getCreatedCourses',
  async (_, { dispatch }) => {
    const callable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.GET_CREATED_COURSES);
    const { data: courses } = await callable();
    dispatch(generatedActions.setCreatedCourses(courses));
  }
);

/**
 * Adds the current item to the course.
 */
const addItemToCourse = createAsyncThunk(
  'addItemToCourse',
  ({ file }, { dispatch, getState }) => new Promise(async (resolve, reject) => {
    const { newItem, selectedCourse } = select(getState());

    const callable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.ADD_ITEM_TO_COURSE);
    const { data } = await callable({ courseUid: selectedCourse, newItem });
    const { item } = data;
    console.log('item added', data);

    // Now upload file.
    dispatch(generatedActions.setUpload({ isUploading: true }));
    const storageRef = app.storage().ref(`raw`);
    const fileRef = storageRef.child(item.uid);
    const uploadTask = fileRef.put(file);

    // Monitor the task
    uploadTask.on('state_changed',
        (snapshot) => {
        const { bytesTransferred, totalBytes } = snapshot;
        dispatch(generatedActions.setUpload({ bytesTransferred, totalBytes }));
      },
      (error) => {
        dispatch(generatedActions.resetUpload());
        throw error;
      },
      async () => {
        // TODO MUX
        // Now get a url for streaming service.
        console.log('GETTING URL...');
        const downloadUrl = await fileRef.getDownloadURL();

        // Send to streaming service.
        console.log('Sending to streaming service:', downloadUrl);
        const callable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.SEND_ITEM_TO_STREAMING_SERVICE);
        const streamResult = await callable({
          uid: item.uid,
          params: { input: downloadUrl, playback_policy: ['public'] }
        });
        console.log('sent', streamResult);

        // Reset UI.
        dispatch(generatedActions.resetUpload());
        dispatch(generatedActions.resetNewItem());

        // Reload the course with the new item.
        await dispatch(_getCurrentCourse());
        resolve();
      }
    );
  })
  // async ({ file }, { dispatch, getState }) => {
  //   const { newItem, selectedCourse } = select(getState());
  //
  //   const callable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.ADD_ITEM_TO_COURSE);
  //   const { data } = await callable({ courseUid: selectedCourse, newItem });
  //   console.log('item added', data);
  //
  //   // Now upload file.
  //   const storageRef = app.storage().ref('raw');
  //   const fileRef = storageRef.child(file.name);
  //   const uploadResult = await fileRef.put(file);
  //   console.log('uploaded', uploadResult);
  //
  //   // TODO Now send it to Mux.
  //
  //   // Reset UI.
  //   dispatch(generatedActions.resetNewItem());
  //
  //   // Reload the course with the new item.
  //   await dispatch(_getCurrentCourse());
  // }
);

const editItem = createAsyncThunk(
  'editItem',
  async () => {}
);

/**
 * Deletes an item from the current course.
 * // TODO No warning.
 */
const deleteItemFromCourse = createAsyncThunk(
  'deleteItemFromCourse',
  async ({ uid }, { dispatch, getState }) => {
    const { selectedCourse } = select(getState());
    console.log('deleteItemFromCourse', selectedCourse, uid);
    const callable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.DELETE_ITEM_FROM_COURSE);
    const result = await callable({ courseUid: selectedCourse, itemUid: uid });

    console.log('deleteItemFromCourse result', result);

    // Reload.
    await dispatch(_getCurrentCourse());
  }
);


// Utility functions for setting loading and error states.
const onPending = (state) => {
  state.error = initialState.error;
  state.isLoading = true;
};

const onRejected = (state, action) => {
  state.isLoading = false;
  state.error = action.error;
};

const onFulfilled = (state) => {
  state.isLoading = false;
};

const { actions: generatedActions, reducer } = createSlice({
  name: 'course',
  initialState,
  reducers: {
    setIsLoading: (state, action) => { state.isLoading = action.payload },
    setVideo: (state, action) => {
      state.video = action.payload;
    },

    // All created courses.
    setCreatedCourses: (state, action) => { state.createdCourses = action.payload },

    // Loading a course.
    setSelectedCourse: (state, action) => { state.selectedCourse = action.payload; },
    setSelectedCourseData: (state, action) => { state.selectedCourseData = action.payload; },
    setSelectedCourseItems: (state, action) => { state.selectedCourseItems = action.payload; },
    resetSelectedCourse: (state, action) => {
      state.selectedCourse = initialState.selectedCourse;
      state.selectedCourseData = initialState.selectedCourseData;
      state.selectedCourseItems = initialState.selectedCourseItems;
    },

    // UI - Adding a new course.
    setNewCourse: (state, action) => {
      state.newCourse = { ...state.newCourse, ...action.payload };
    },
    setNewCourseIsOpen: (state, action) => { state.newCourseIsOpen = action.payload; },
    resetNewCourse: (state, action) => {
      state.newCourse = initialState.newCourse;
      state.newCourseIsOpen = false;
    },

    // UI - Adding an item to a course.
    setNewItem: (state, action) => {
      state.newItem = { ...state.newItem, ...action.payload };
    },
    setNewItemIsOpen: (state, action) => { state.newItemIsOpen = action.payload },
    resetNewItem: (state, action) => {
      state.newItem = initialState.newItem;
      state.newItemIsOpen = false;
    },
    setUpload: (state, action) => {
      state.upload = { ...state.upload, ...action.payload };
    },
    resetUpload: (state, action) => { state.upload = initialState.upload; }
  },
  extraReducers: {
    [fetchAssets.pending]: (state) => { state.isLoading = true; },
    [fetchAssets.rejected]: (state) => { state.isLoading = false; },
    [fetchAssets.fulfilled]: (state, action) => {
      state.isLoading = false;
      state.items = action.payload;
    },

    // --------------------------------------------------------------------------------
    [createCourse.pending]: onPending,
    [createCourse.rejected]: onRejected,
    [createCourse.fulfilled]: onFulfilled,

    [setAndLoadSelectedCourse.pending]: onPending,
    [setAndLoadSelectedCourse.rejected]: onRejected,
    [setAndLoadSelectedCourse.fulfilled]: onFulfilled,

    [reloadCurrentCourse.pending]: onPending,
    [reloadCurrentCourse.rejected]: onRejected,
    [reloadCurrentCourse.fulfilled]: onFulfilled,

    [deleteSelectedCourse.pending]: onPending,
    [deleteSelectedCourse.rejected]: onRejected,
    [deleteSelectedCourse.fulfilled]: onFulfilled,

    [addItemToCourse.pending]: onPending,
    [addItemToCourse.rejected]: onRejected,
    [addItemToCourse.fulfilled]: onFulfilled,

    [deleteItemFromCourse.pending]: onPending,
    [deleteItemFromCourse.rejected]: onRejected,
    [deleteItemFromCourse.fulfilled]: onFulfilled,
  }
});

const select = ({ course }) => course;
const selectItems = createSelector(select, ({ items }) => items);
const selectors = { select, selectItems };

const actions = {
  ...generatedActions,
  fetchAssets, fetchPlaybackId,
  createCourse, setAndLoadSelectedCourse, reloadCurrentCourse, deleteSelectedCourse, _getCreatedCourses,
  addItemToCourse, deleteItemFromCourse, editItem
};

export { selectors, actions };
export default reducer;
