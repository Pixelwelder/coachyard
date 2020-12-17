import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { actions as logActions, createLog } from '../log/logSlice';
import { actions as appActions } from '../app/appSlice';
import app from 'firebase/app';
import { ERROR } from '../log/logTypes';
import { CALLABLE_FUNCTIONS } from '../../app/callableFunctions';

const initialState = {
  isLoading: false,
  video: null,
  items: [],

  newCourseIsOpen: false,
  newCourse: {
    displayName: '',
    description: ''
  },
  selectedCourse: '',
  selectedCourseData: null,

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
    dispatch(generatedActions.setNewCourse(initialState.newCourse));
    dispatch(generatedActions.setNewCourseIsOpen(false));
    await dispatch(appActions.refreshUser());
    await dispatch(setAndLoadSelectedCourse(data.courseUid));
  }
);

const setAndLoadSelectedCourse = createAsyncThunk(
  'setSelectedCourse',
  async (selectedCourse, { dispatch }) => {
    const callable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.GET_COURSE);
    const { data } = await callable({ uid: selectedCourse });
    console.log('got', data);

    return { data, uid: selectedCourse };
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

const getCourse = createAsyncThunk(
  'getCourse',
  async (_, { getState }) => {
    // Load the current course.
    const state = getState();
    const { selectedCourse } = select(state);
    const getCourseCallable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.GET_COURSE);
    const result = await getCourseCallable({ uid: selectedCourse });
  }
);

const giveCourse = createAsyncThunk(
  'giveCourse',
  async (params) => {
    const giveCourseCallable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.GIVE_COURSE);
    const result = await giveCourseCallable(params);
    console.log('give course:', result);
  }
)

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
    setNewCourse: (state, action) => {
      state.newCourse = { ...state.newCourse, ...action.payload };
    },
    setNewCourseIsOpen: (state, action) => { state.newCourseIsOpen = action.payload; },

    setNewItem: (state, action) => {
      state.newItem = { ...state.newItem, ...action.payload };
    },
    setNewItemIsOpen: (state, action) => { state.newItemIsOpen = action.payload }
  },
  extraReducers: {
    [fetchAssets.pending]: (state) => { state.isLoading = true; },
    [fetchAssets.rejected]: (state) => { state.isLoading = false; },
    [fetchAssets.fulfilled]: (state, action) => {
      state.isLoading = false;
      state.items = action.payload;
    },

    [createCourse.fulfilled]: (state, action) => {
      state.newCourse = initialState.newCourse;
    },

    [setAndLoadSelectedCourse.fulfilled]: (state, action) => {
      state.selectedCourse = action.payload.uid;
      state.selectedCourseData = action.payload.data;
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
