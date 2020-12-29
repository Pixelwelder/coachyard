import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { actions as logActions, createLog } from '../log/logSlice';
import app from 'firebase/app';
import { CALLABLE_FUNCTIONS } from '../../app/callableFunctions';
import { parseUnserializables } from '../../util/firestoreUtils';

const MODES = {
  VIEW: 'view',
  EDIT: 'edit',
  CREATE: 'create',
  CLOSED: 'closed',
  OPEN: 'open'
};

const initialState = {
  isLoading: false,
  video: null,
  items: [], // Assets. TODO.

  // All courses.
  createdCourses: [],
  enrolledCourses: [],

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

  // Delete course.
  deleteCourseUI: {
    mode: MODES.CLOSED
  },

  giveCourseUI: {
    mode: MODES.CLOSED,
    email: ''
  },

  // UI
  itemUI: {
    mode: MODES.CLOSED,
    isChangingFile: false,
  },
  newItem: {
    displayName: '',
    description: '',
    file: ''
  },
  upload: {
    isUploading: false,
    bytesTransferred: 0,
    totalBytes: 0
  },

  deleteItemUI: {
    mode: MODES.CLOSED,
    uid: ''
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
    dispatch(generatedActions.resetNewCourseUI());
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
 * Sets the currently selected course, then loads it.
 * @param selectedCourse - the uid of the course to set/load
 */
let unsubscribeSelectedCourse;
let unsubscribeSelectedItems;
const setAndLoadSelectedCourse = createAsyncThunk(
  'setAndLoadSelectedCourse',
  async (selectedCourse, { dispatch }) => {
    console.log('setAndLoadSelectedCourse');
    dispatch(generatedActions.setSelectedCourse(selectedCourse));

    if (unsubscribeSelectedCourse) unsubscribeSelectedCourse();
    unsubscribeSelectedCourse = app.firestore().collection('courses').doc(selectedCourse)
      .onSnapshot((snapshot) => {
        const course = parseUnserializables(snapshot.data());
        console.log('course snapshot', course);
        dispatch(generatedActions.setSelectedCourseData(course));
      }
    );

    if (unsubscribeSelectedItems) unsubscribeSelectedItems();
    unsubscribeSelectedItems = app.firestore().collection('items')
      .where('courseUid', '==', selectedCourse)
      .onSnapshot(((snapshot) => {
        const items = snapshot.docs.map(doc => parseUnserializables(doc.data()));
        console.log('items snapshot', items);
        dispatch(generatedActions.setSelectedCourseItems(items));
      })
    );
  }
);

/**
 * Deletes the currently selected course. No warning.
 * MOVED.
 */
const deleteSelectedCourse = createAsyncThunk(
  'deleteCurrentCourse',
  async (_, { getState, dispatch }) => {
    const { selectedCourse } = select(getState());
    const callable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.DELETE_COURSE);
    await callable({ uid: selectedCourse });

    // Reset UI.
    // dispatch(generatedActions.resetSelectedCourse());
    dispatch(generatedActions.resetDeleteCourseUI());
  }
);

const giveCourse = createAsyncThunk(
  'giveCourse',
  async (_, { getState, dispatch }) => {
    console.log('giveCourse');
    const {
      giveCourseUI: { email },
      selectedCourse
    } = select(getState());

    const callable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.GIVE_COURSE);
    await callable({ email, courseUid: selectedCourse });

    dispatch(generatedActions.resetGiveCourseUI());
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
    // await dispatch(_getCurrentCourse());
  }
);

/**
 * Adds the current item to the course.
 * MOVED
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

    // Reset UI.
    dispatch(generatedActions.resetNewItem());
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
  async (_, { dispatch, getState }) => {
    const { deleteItemUI: { uid } } = select(getState());
    const callable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.DELETE_ITEM);
    const result = await callable({ uid });

    dispatch(generatedActions.resetDeleteItemUI());
  }
);

const init = createAsyncThunk(
  'initCourses',
  async (_, { getState, dispatch }) => {
    let unsubscribeUser;
    let unsubscribeCreated;

    const handleChangedCourses = (snapshot) => {
      const courses = snapshot.docs.map(doc => parseUnserializables(doc.data()));
      dispatch(generatedActions.setCreatedCourses(courses));

      // If the user just removed one, switch to another.
      const { selectedCourse } = select(getState());
      if (!courses.find(course => course.uid === selectedCourse)) {
        if (courses.length) {
          dispatch(setAndLoadSelectedCourse(courses[courses.length - 1].uid))
        } else {
          dispatch(generatedActions.resetSelectedCourse());
        }
      }

      // If the user just added one, switch to it.
      let toLoad;
      snapshot.docChanges().forEach((change) => {
        const { doc, type } = change;
        if (type === 'added') toLoad = doc.id;
      });
      if (toLoad) dispatch(setAndLoadSelectedCourse(toLoad));
    };

    const handleChangedUser = (snapshot) => {
      const userMeta = snapshot.data();
      if (userMeta) {
        const { enrolled } = userMeta;

        console.log('updating enrolled courses', enrolled);
        dispatch(generatedActions.setEnrolledCourses(enrolled));
      }
    }

    app.auth().onAuthStateChanged(async (authUser) => {
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeCreated) unsubscribeCreated();

      if (authUser) {
        const { uid } = authUser;

        // Keep an eye on the user meta object, because we need to know when the user changes enrollment.
        unsubscribeUser = app.firestore().collection('users').doc(uid)
          .onSnapshot(handleChangedUser);

        // Now watch for changes in created courses.
        unsubscribeCreated = app.firestore().collection('courses')
          .where('creatorUid', '==', uid)
          .onSnapshot(handleChangedCourses);
      }
    })
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

const setValue = name => (state, action) => {
  state[name] = action.payload;
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
    setCreatedCourses: setValue('createdCourses'),

    // All enrolled courses.
    setEnrolledCourses: setValue('enrolledCourses'),

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
    resetNewCourseUI: (state, action) => {
      state.newCourse = initialState.newCourse;
      state.newCourseMode = MODES.CLOSED;
    },

    // UI - Deleting a course.
    openDeleteCourseUI: (state) => { state.deleteCourseUI.mode = MODES.OPEN; },
    setDeleteCourseUI: (state, action) => {
      state.deleteCourseUI = { ...state.deleteCourseUI, ...action.payload };
    },
    resetDeleteCourseUI: (state) => { state.deleteCourseUI = initialState.deleteCourseUI; },

    // UI - Giving a course.
    openGiveCourseUI: (state, action) => {
      state.giveCourseUI = {
        ...initialState.giveCourseUI,
        mode: MODES.OPEN
      };
    },
    setGiveCourseUI: (state, action) => {
      state.giveCourseUI = { ...state.giveCourseUI, ...action.payload };
    },
    resetGiveCourseUI: (state, action) => {
      state.giveCourseUI = initialState.giveCourseUI;
    },

    // UI - Adding an item to a course.
    createItem: (state, action) => {
      state.newItem = initialState.newItem;
      state.itemUI.mode = MODES.CREATE;
    },
    editItem: (state, action) => {
      state.newItem = action.payload;
      state.itemUI.mode = MODES.EDIT;
    },
    closeItem: (state, action) => {
      state.itemUI = initialState.itemUI;
    },
    setNewItem: (state, action) => {
      state.newItem = { ...state.newItem, ...action.payload };
    },
    resetNewItem: (state, action) => {
      state.newItem = initialState.newItem;
      state.itemUI = initialState.itemUI;
    },
    setUpload: (state, action) => {
      state.upload = { ...state.upload, ...action.payload };
    },
    resetUpload: (state, action) => { state.upload = initialState.upload; },
    setItemUI: (state, action) => { state.itemUI = { ...state.itemUI, ...action.payload }; },

    openDeleteItemUI: (state, action) => {
      state.deleteItemUI = {
        mode: MODES.OPEN,
        uid: action.payload
      }
    },
    resetDeleteItemUI: (state) => { state.deleteItemUI.mode = MODES.CLOSED; }
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

    [deleteSelectedCourse.pending]: onPending,
    [deleteSelectedCourse.rejected]: onRejected,
    [deleteSelectedCourse.fulfilled]: onFulfilled,

    [giveCourse.pending]: onPending,
    [giveCourse.rejected]: onRejected,
    [giveCourse.fulfilled]: onFulfilled,

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
  init,
  fetchAssets, fetchPlaybackId,
  createCourse, setAndLoadSelectedCourse, deleteSelectedCourse, giveCourse,
  addItemToCourse, updateItem, deleteItem
};

export { selectors, actions, MODES };
export default reducer;
