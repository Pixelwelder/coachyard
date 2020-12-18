import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { actions as logActions, createLog } from '../log/logSlice';
import { actions as appActions } from '../app/appSlice';
import app from 'firebase/app';
import { ERROR } from '../log/logTypes';
import { CALLABLE_FUNCTIONS } from '../../app/callableFunctions';

const initialState = {
  isLoading: false,
  video: null,
  items: [], // Assets. TODO.

  // Actual loaded course.
  selectedCourse: '',
  selectedCourseData: null,

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
    description: ''
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
const createCourse = createAsyncThunk(
  'createCourse',
  async (_, { dispatch, getState }) => {
    const { newCourse } = select(getState());
    const createCourseCallable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.CREATE_COURSE);
    const { data: { courseUid } } = await createCourseCallable(newCourse);

    // Reset UI.
    dispatch(generatedActions.resetNewCourse());

    // Reload data.
    await dispatch(appActions.refreshUser());
    await dispatch(setAndLoadSelectedCourse(courseUid));
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
    const getCourseCallable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.GET_COURSE);
    const { data: course } = await getCourseCallable({ uid: selectedCourse });
    console.log('getCurrentCourse', course);
    dispatch(generatedActions.setSelectedCourseData(course));
  }
);

const setAndLoadSelectedCourse = createAsyncThunk(
  'setAndLoadSelectedCourse',
  async (selectedCourse, { dispatch }) => {
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
 * Adds the current item to the course.
 */
const addItemToCourse = createAsyncThunk(
  'addItemToCourse',
  async (_, { dispatch, getState }) => {
    const { newItem, selectedCourse } = select(getState());
    const callable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.ADD_ITEM_TO_COURSE);
    const { data } = await callable({ courseUid: selectedCourse, newItem });
    console.log('done', data);

    // Reset UI.
    dispatch(generatedActions.resetNewItem());

    // Reload the course with the new item.
    await dispatch(_getCurrentCourse());
  }
);

const _deleteCourse = createAsyncThunk(
  'deleteCourse',
  async ({ uid }, { dispatch }) => {
    console.log('deleteCourse', uid);
    const callable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.DELETE_COURSE);
    const result = await callable({ uid });
    console.log('deleteCourse', result);
  }
);

const deleteSelectedCourse = createAsyncThunk(
  'deleteCurrentCourse',
  async (_, { getState, dispatch }) => {
    const { selectedCourse } = select(getState());
    console.log('deleteSelectedCourse', selectedCourse);
    await dispatch(_deleteCourse({ uid: selectedCourse }));

    // Reset UI.
    dispatch(generatedActions.resetSelectedCourse());

    // Reload user.
    await dispatch(appActions.refreshUser());
  }
)

const deleteItemFromCourse = createAsyncThunk(
  'deleteItemFromCourse',
  async () => {}
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

    // Loading a course.
    setSelectedCourse: (state, action) => { state.selectedCourse = action.payload; },
    setSelectedCourseData: (state, action) => { state.selectedCourseData = action.payload; },
    resetSelectedCourse: (state, action) => {
      state.selectedCourse = initialState.selectedCourse;
      state.selectedCourseData = initialState.selectedCourseData;
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
    }
  },
  extraReducers: {
    [fetchAssets.pending]: (state) => { state.isLoading = true; },
    [fetchAssets.rejected]: (state) => { state.isLoading = false; },
    [fetchAssets.fulfilled]: (state, action) => {
      state.isLoading = false;
      state.items = action.payload;
    },

    [createCourse.pending]: onPending,
    [createCourse.rejected]: onRejected,
    [createCourse.fulfilled]: onFulfilled,

    [setAndLoadSelectedCourse.pending]: onPending,
    [setAndLoadSelectedCourse.rejected]: onRejected,
    [setAndLoadSelectedCourse.fulfilled]: onFulfilled,

    [deleteSelectedCourse.pending]: onPending,
    [deleteSelectedCourse.rejected]: onRejected,
    [deleteSelectedCourse.fulfilled]: onFulfilled,

    [addItemToCourse.pending]: onPending,
    [addItemToCourse.rejected]: onRejected,
    [addItemToCourse.fulfilled]: onFulfilled
  }
});

const select = ({ course }) => course;
const selectItems = createSelector(select, ({ items }) => items);
const selectors = { select, selectItems };

const actions = {
  ...generatedActions,
  fetchAssets, fetchPlaybackId,
  createCourse, setAndLoadSelectedCourse, deleteSelectedCourse,
  addItemToCourse, deleteItemFromCourse
};

export { selectors, actions };
export default reducer;
