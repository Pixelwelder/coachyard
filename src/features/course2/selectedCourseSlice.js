import app from 'firebase/app';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { selectors as appSelectors } from '../app/appSlice';
import { parseUnserializables } from '../../util/firestoreUtils';

const initialState = {
  id: '',
  isLoading: false,
  error: null,

  course: null,
  items: [],
  selectedItem: null,
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

let unsubscribeItem = () => {};
const setSelectedItemUid = createAsyncThunk(
  'setSelectedItemUid',
  async (itemUid, { dispatch, getState }) => {
    unsubscribeItem();

    if (itemUid) {
      unsubscribeItem = app.firestore()
        .collection('items')
        .doc(itemUid)
        .onSnapshot((snapshot) => {
          if (snapshot.exists) {
            const data = snapshot.data();
            dispatch(generatedActions._setSelectedItemUid(data.uid));
            dispatch(generatedActions._setSelectedItem(data));
          }
        });
    }
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
    _setSelectedItemUid: setValue('selectedItemUid'),
    _setSelectedItem: setValue('selectedItem')
  },
  extraReducers: {
    [setId.pending]: onPending,
    [setId.rejected]: onRejected,
    [setId.fulfilled]: onFulfilled
  }
});

const actions = { ...generatedActions, setId, setSelectedItemUid };

const select = ({ selectedCourse }) => selectedCourse;
const selectSelectedItem = createSelector(
  select,
  ({ selectedItem }) => selectedItem
);
const selectOwnsCourse = createSelector(
  select,
  ({ course }) => {
    const currentUser = app.auth().currentUser;
    return !!(course && currentUser && (currentUser.uid === course.creatorUid));
  }
);
const selectors = { select, selectSelectedItem, selectOwnsCourse };

export { actions, selectors };
export default reducer;
