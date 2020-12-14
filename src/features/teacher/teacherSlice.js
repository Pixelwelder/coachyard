import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import app from 'firebase/app';
import { CALLABLE_FUNCTIONS } from '../../app/callableFunctions';
import { actions as appActions } from '../app/appSlice';

const initialState = {
  isLoading: false,
  error: null,
  courses: [],
  students: []
};

const init = createAsyncThunk(
  'initTeacher',
  async (_, { dispatch }) => {
    await dispatch(getCreatedCourses());
  }
);

const createCourse = createAsyncThunk(
  'createCourse',
  async ({ course }) => {
    try {
      const createCourse = app.functions().httpsCallable(CALLABLE_FUNCTIONS.CREATE_COURSE);
      const result = await createCourse({ course });
      console.log(result);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
);

const getCreatedCourses = createAsyncThunk(
  'getAllCourses',
  async () => {
    try {
      const getAllCourses = app.functions().httpsCallable(CALLABLE_FUNCTIONS.GET_CREATED_COURSES);
      const result = await getAllCourses();
      return result.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
);

const createStudent = createAsyncThunk(
  'createStudent',
  async (params, { dispatch }) => {
    console.log('creating student', )
    const createStudent = app.functions().httpsCallable(CALLABLE_FUNCTIONS.CREATE_STUDENT);
    const result = await createStudent(params);
    console.log('result', result);
    dispatch(appActions.refreshUser());
  }
)

const onPending = () => (state, action) => {
  state.isLoading = true;
  state.error = null;
};

const onRejected = () => (state, action) => {
  state.isLoading = false;
  state.error = action.error;
};

const onFulfilled = name => (state, action) => {
  state.isLoading = false;
  if (name) state[name] = action.payload;
};

const { reducer, actions: generatedActions } = createSlice({
  name: 'teacher',
  initialState,
  reducers: {},
  extraReducers: {
    [createCourse.pending]: onPending(),
    [createCourse.rejected]: onRejected(),
    [createCourse.fulfilled]: onFulfilled(),

    [createStudent.pending]: onPending(),
    [createStudent.rejected]: onRejected(),
    [createStudent.fulfilled]: onFulfilled(),

    [getCreatedCourses.pending]: onPending(),
    [getCreatedCourses.rejected]: onRejected(),
    [getCreatedCourses.fulfilled]: onFulfilled('courses')
  }
});

const actions = { init, createCourse, getCreatedCourses, createStudent, ...generatedActions };

const select = ({ teacher }) => teacher;
const selectCourses = createSelector(select, ({ courses }) => {
  return courses.map(({ id, data }) => ({ ...data, id }));
});
const selectors = { select, selectCourses };

export { actions, selectors };
export default reducer;
