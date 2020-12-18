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
    console.log('createCourse');
    const state = getState();
    const { newCourse } = select(state);
    console.log(newCourse);
    const createCourseCallable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.CREATE_COURSE);
    const { data } = await createCourseCallable(newCourse);
    console.log('create course:', data);

    // Reset UI.
    dispatch(generatedActions.resetNewCourse());

    // Reload data.
    await dispatch(appActions.refreshUser());
    await dispatch(getCurrentCourse());
  }
);

const getCurrentCourse = createAsyncThunk(
  'getCurrentCourse',
  async (_, { getState, dispatch }) => {
    // Load the current course.
    const state = getState();
    const { selectedCourse } = select(state);
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
    dispatch(getCurrentCourse());
  }
);

const giveCourse = createAsyncThunk(
  'giveCourse',
  async (params) => {
    const giveCourseCallable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.GIVE_COURSE);
    const result = await giveCourseCallable(params);
    console.log('give course:', result);
  }
);

const addItemToCourse = createAsyncThunk(
  'addItemToCourse',
  async (_, { dispatch, getState }) => {
    console.log('add item to course');
    const state = getState();
    const { newItem, selectedCourse } = select(state);
    console.log(newItem);
    const callable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.ADD_ITEM_TO_COURSE);
    const { data } = await callable({ courseUid: selectedCourse, newItem });
    console.log('done', data);
    await dispatch(setAndLoadSelectedCourse(selectedCourse));
  }
);

const init = createAsyncThunk(
  'courseInit',
  async ({ id }, { dispatch }) => {
    // TODO Use course ID.
    const result = await dispatch(fetchAssets());
    console.log('fetchAssets', result);
  }
);

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
    // TODO Reset?

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

    [addItemToCourse.fulfilled]: (state, action) => {
      state.newItemIsOpen = false;
      state.newItem = initialState.newItem;
    }
  }
});

const select = ({ course }) => course;
const selectItems = createSelector(select, ({ items }) => items);
const selectors = { select, selectItems };

const actions = {
  ...generatedActions, init, fetchAssets, fetchPlaybackId, createCourse, giveCourse,
  setAndLoadSelectedCourse, addItemToCourse
};

export { selectors, actions };
export default reducer;
