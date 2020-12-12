import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import app from 'firebase/app';
import { CALLABLE_FUNCTIONS } from '../../app/callableFunctions';

const initialState = {
  isLoading: false,
  error: null
};

const init = createAsyncThunk(
  'initTeacher',
  async () => {}
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

const getAllCourses = createAsyncThunk(
  'getAllCourses',
  async () => {
    try {
      const getAllCourses = app.functions().httpsCallable(CALLABLE_FUNCTIONS.GET_ALL_COURSES);
      const result = getAllCourses();
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
);

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
    [createCourse.fulfilled]: onFulfilled()
  }
});

const actions = { init, createCourse, ...generatedActions };

const select = ({ teacher }) => teacher;
const selectors = { select };

export { actions, selectors };
export default reducer;
