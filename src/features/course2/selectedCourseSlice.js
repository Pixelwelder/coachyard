import app from 'firebase/app';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { selectors as catalogSelectors } from '../catalog/catalogSlice';
import { parseUnserializables } from '../../util/firestoreUtils';

const initialState = {
  id: '',
  isLoading: false,
  error: null,

  course: null,
  items: [],
  selectedItemUid: null
};

let unsubscribeCourse = () => {};
let unsubscribeItems = () => {};
/**
 * Sets the selected course.
 * This loads the course and its items.
 * @param id - the id of the course to load.
 */
const setId = createAsyncThunk(
  'setId',
  async ({ id, history }, { dispatch }) => {
    unsubscribeCourse();
    unsubscribeItems();

    dispatch(generatedActions._setId(id));

    unsubscribeCourse = app.firestore()
      .collection('courses')
      .where('uid', '==', id)
      .onSnapshot((snapshot) => {
        if (!snapshot.size) {
          // TODO this is nasty.
          history.push('/dashboard');
          return;
        }

        const course = parseUnserializables(snapshot.docs[0].data());
        dispatch(generatedActions.setCourse(course));
      });

    unsubscribeItems = await app.firestore()
      .collection('items')
      .where('courseUid', '==', id)
      .orderBy('created')
      .onSnapshot((snapshot) => {
        const items = snapshot.docs.map(item => parseUnserializables(item.data()));
        dispatch(generatedActions.setItems(items));
      });
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
  name: 'course',
  initialState,
  reducers: {
    _setId: setValue('id'),
    setCourse: setValue('course'),
    setItems: setValue('items'),
    setSelectedItemUid: setValue('selectedItemUid')
  },
  extraReducers: {
    [setId.pending]: onPending,
    [setId.rejected]: onRejected,
    [setId.fulfilled]: onFulfilled
  }
});

const actions = { ...generatedActions, setId };

const select = ({ selectedCourse }) => selectedCourse;
const selectSelectedItem = createSelector(
  select,
  ({ items, selectedItemUid }) => {
    return items.find(({ uid }) => uid === selectedItemUid);
  }
);
const selectors = { select, selectSelectedItem };

export { actions, selectors };
export default reducer;
