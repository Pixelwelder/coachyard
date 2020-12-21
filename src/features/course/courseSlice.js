import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { actions as logActions, createLog } from '../log/logSlice';
import app from 'firebase/app';
import { CALLABLE_FUNCTIONS } from '../../app/callableFunctions';

const MODES = {
  VIEW: 'view',
  EDIT: 'edit',
  CREATE: 'create',
  CLOSED: 'closed'
};

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
  mode: MODES.VIEW,

  // UI
  newCourseMode: MODES.CLOSED,
  newCourse: {
    displayName: '',
    description: ''
  },

  // UI
  newItemMode: MODES.CLOSED,
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
  async ({ update = false }, { dispatch, getState }) => {
    const { newCourse } = select(getState());
    const createCourseCallable = app.functions()
      .httpsCallable(update ? CALLABLE_FUNCTIONS.UPDATE_COURSE : CALLABLE_FUNCTIONS.CREATE_COURSE);
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

const _addItemToCourse = createAsyncThunk(
  '_addItemToCourse',
  async (_, { getState }) => {
    const { newItem, selectedCourse } = select(getState());

    const callable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.ADD_ITEM_TO_COURSE);
    const { data } = await callable({ courseUid: selectedCourse, newItem });
    const { item } = data;
    console.log('item added', data);
    return item;
  }
);

const _uploadItem = createAsyncThunk(
  'updateItem',
  async ({ uid, file }, { dispatch }) => new Promise((resolve, reject) => {
    dispatch(generatedActions.setUpload({ isUploading: true }));

    // Upload the file to Firebase Storage.
    const storageRef = app.storage().ref(`raw`);
    const fileRef = storageRef.child(uid);
    const uploadTask = fileRef.put(file);

    // Monitor the task
    uploadTask.on('state_changed',
      (snapshot) => {
        const { bytesTransferred, totalBytes } = snapshot;
        dispatch(generatedActions.setUpload({ isUploading: true, bytesTransferred, totalBytes }));
      },
      (error) => {
        dispatch(generatedActions.resetUpload());
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
      uid: uid,
      params: { input: downloadUrl, playback_policy: ['public'] }
    });
    console.log('sent', streamResult);
  }
);

const _resetItem = createAsyncThunk(
  '_resetItem',
  async (_, { dispatch }) => {
    // Reset UI.
    dispatch(generatedActions.resetUpload());
    dispatch(generatedActions.resetNewItem());

    // Reload the course with the new item.
    await dispatch(_getCurrentCourse());
  }
);

/**
 * Adds the current item to the course.
 */
const addItemToCourse = createAsyncThunk(
  'addItemToCourse',
  async ({ file }, { dispatch, getState }) => {

    // Create the data object.
    const { payload: item } = await dispatch(_addItemToCourse());
    const { uid } = item;

    // Upload the file if applicable.
    if (file) {
      // First, to Firebase Storage.
      const { payload: downloadUrl } = await dispatch(_uploadItem({ uid, file }));

      // Send to streaming service.
      await dispatch(_sendToStreamingService({ uid, downloadUrl }));
      console.log('addItemToCourse: complete');
    }

    // Reset UI and load the current course again.
    await dispatch(_resetItem());

    // Done.
  }
);

/**
 * Updates a single item.
 */
const updateItem = createAsyncThunk(
  'updateItem',
  async ({ file }, { getState, dispatch }) => {
    // Update the data object.
    const { newItem } = select(getState());
    const callable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.UPDATE_ITEM);
    const { data: { item } } = await callable({ uid: newItem.uid, update: newItem });
    console.log('updated:', item);
    const { uid } = item;

    // Update the file, if necessary.
    if (file) {
      // Upload to Firebase Storage.
      const { payload: downloadUrl } = await dispatch(_uploadItem({ uid, file }));

      // Send to streaming service.
      await dispatch(_sendToStreamingService({ uid, downloadUrl }));
      console.log('updateItem: complete');
    }

    // Reset UI and load the current course again.
    await dispatch(_resetItem());
  }
);

/**
 * Deletes an item from the current course.
 * // TODO No warning.
 */
const deleteItem = createAsyncThunk(
  'deleteItem',
  async ({ uid }, { dispatch, getState }) => {
    const callable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.DELETE_ITEM);
    const result = await callable({ uid });

    console.log('deleteItem result', result);

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

    // UI - overall mode
    setMode: (state, action) => { state.mode = action.payload; },

    // UI - Adding a new course.
    createNewCourse: (state, action) => {
      state.newCourseMode = MODES.CREATE;
    },
    editCourse: (state, action) => {
      state.newCourseMode = MODES.EDIT;
      state.newCourse = state.selectedCourseData;
    },
    closeCourse: (state, action) => {
      state.newCourseMode = MODES.CLOSED;
    },
    // setNewCourseMode: (state, action) => { state.newCourseMode = action.payload; },
    setNewCourse: (state, action) => {
      state.newCourse = { ...state.newCourse, ...action.payload };
    },
    // setNewCourseIsOpen: (state, action) => { state.newCourseIsOpen = action.payload; },
    resetNewCourse: (state, action) => {
      state.newCourse = initialState.newCourse;
      state.newCourseMode = MODES.CLOSED;
    },

    // UI - Adding an item to a course.
    createItem: (state, action) => {
      state.newItemMode = MODES.CREATE;
    },
    editItem: (state, action) => {
      state.newItemMode = MODES.EDIT;
      state.newItem = action.payload;
    },
    closeItem: (state, action) => {
      state.newItemMode = MODES.CLOSED;
    },
    // setNewItemMode: (state, action) => { state.newItemMode = action.payload; },
    setNewItem: (state, action) => {
      state.newItem = { ...state.newItem, ...action.payload };
    },
    resetNewItem: (state, action) => {
      state.newItem = initialState.newItem;
      state.newItemMode = MODES.CLOSED;
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

    [updateItem.pending]: onPending,
    [updateItem.rejected]: onRejected,
    [updateItem.fulfilled]: onFulfilled,

    [deleteItem.pending]: onPending,
    [deleteItem.rejected]: onRejected,
    [deleteItem.fulfilled]: onFulfilled,
  }
});

const select = ({ course }) => course;
const selectItems = createSelector(select, ({ items }) => items);
const selectors = { select, selectItems };

const actions = {
  ...generatedActions,
  fetchAssets, fetchPlaybackId,
  createCourse, setAndLoadSelectedCourse, reloadCurrentCourse, deleteSelectedCourse, _getCreatedCourses,
  addItemToCourse, updateItem, deleteItem
};

export { selectors, actions, MODES };
export default reducer;
