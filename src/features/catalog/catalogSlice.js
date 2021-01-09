import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import app from 'firebase/app';
import { CALLABLE_FUNCTIONS } from '../../app/callableFunctions';
import { parseUnserializables } from '../../util/firestoreUtils';
import { actions as uiActions, selectors as uiSelectors } from '../ui/uiSlice';
import MODES from '../ui/Modes';
import { reset, setValue } from '../../util/reduxUtils';

/**
 * Provides the list of courses this user has access to.
 */
const initialState = {
  teaching: {
    courses: [],
    isLoading: false,
    error: null
  },

  learning: {
    courses: [],
    isLoading: false,
    error: null
  },

  tokens: []
};

let userListener = () => {};
let metaListener = () => {};
let courseListener = () => {};
const init = createAsyncThunk(
  'initCatalog',
  async (_, { dispatch }) => {
    app.auth().onAuthStateChanged((authUser) => {
      userListener();
      metaListener();
      courseListener();

      dispatch(generatedActions.reset());

      if (authUser) {
        const { uid } = authUser;

        // Listen for all courses.
        courseListener = app.firestore()
          .collection('tokens')
          .where('user', '==', uid)
          .orderBy('created')
          .onSnapshot((snapshot) => {
            let tokens = [];
            if (snapshot.size) {
              tokens = snapshot.docs.map(doc => parseUnserializables(doc.data()));
            }
            dispatch(generatedActions.setTokens(tokens));
          });
      }
    });
  }
);

const createNewCourse = createAsyncThunk(
  'createCourse',
  async (params, { dispatch, getState }) => {
    const callable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.CREATE_COURSE);
    const result = await callable(params);
  }
);

const updateCourse = createAsyncThunk(
  'updateCourse',
  async (params, { dispatch }) => {
    const callable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.UPDATE_COURSE);
    const result = await callable(params);
  }
);

const deleteCourse = createAsyncThunk(
  'deleteCourse',
  async ({ uid }, { dispatch, getState }) => {
    console.log('deleting', uid);

    dispatch(uiActions.resetDialog('deleteDialog'));
    const { deleteDialog } = uiSelectors.select(getState());
    dispatch(uiActions.setUI({ deleteDialog: { ...deleteDialog, mode: MODES.PROCESSING }}));

    try {
      const callable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.DELETE_COURSE);
      await callable({ uid });
      dispatch(uiActions.resetUI('deleteDialog'));
    } catch (error) {
      dispatch(uiActions.setUI({ deleteDialog: { ...deleteDialog, error, mode: MODES.VIEW }}));
    }
  }
);

const _addItemToCourse = createAsyncThunk(
  '_addItemToCourse',
  async ({ item, courseUid }, { getState }) => {
    const callable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.CREATE_ITEM);
    const { data } = await callable({ courseUid, item });
    console.log('item added', data);
    return data.item;
  }
);

const _uploadItem = createAsyncThunk(
  '_uploadItem',
  async ({ uid, file }, { dispatch, getState }) => new Promise((resolve, reject) => {
    console.log('_uploadItem', uid, file);

    // Upload the file to Firebase Storage.
    const storageRef = app.storage().ref(`raw`);
    const fileRef = storageRef.child(uid);
    const uploadTask = fileRef.put(file);

    // Monitor the task
    uploadTask.on('state_changed',
      (snapshot) => {
        const { bytesTransferred, totalBytes } = snapshot;
        dispatch({ type: 'upload/progress', payload: { bytesTransferred, totalBytes }});
      },
      (error) => {
        console.error(error.message);
        dispatch({ type: 'upload/error', error });
        return reject(error);
      },
      async () => {
        // Now get a url for streaming service.
        console.log('upload complete', file);
        dispatch({ type: 'upload/complete' });
        return resolve(fileRef.getDownloadURL());
      }
    );
  })
);

const _sendToStreamingService = createAsyncThunk(
  '_sendToStreamingService',
  async ({ uid, downloadUrl }) => {
    console.log('Sending to streaming service:', downloadUrl);
    const callable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.SEND_ITEM);
    const streamResult = await callable({
      uid,
      params: { input: downloadUrl, playback_policy: ['public'] }
    });
    console.log('sent', streamResult);
  }
);

/**
 * Adds the current item to the course.
 *
 * @param courseUid - the course to add the item to
 * @param item - the item to add
 * @param file - the matching file to upload
 */
const createItem = createAsyncThunk(
  'createItem',
  async ({ courseUid, item, file }, { dispatch, getState }) => {
    try {
      // Create the data object.
      const { payload } = await dispatch(_addItemToCourse({ courseUid, item }));
      const { uid } = payload;

      // Upload the file if applicable.
      if (file) {
        // First, to Firebase Storage.
        console.log('uploading...');
        const uploadResult = await dispatch(_uploadItem({ uid, file }));
        const { payload: downloadUrl, error } = uploadResult;
        if (error) throw new Error(error.message);

        // Send to streaming service.
        await dispatch(_sendToStreamingService({ uid, downloadUrl }));
        console.log('createItem: complete');
      }
      // Reset UI.
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
);

const updateItem = createAsyncThunk(
  'updateItem',
  async ({ uid, update, file }, { dispatch }) => {
    // Update data object.
    const callable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.UPDATE_ITEM);
    const updateResult = await callable({ uid, update });

    // Upload new file.
    if (file) {
      const { payload: downloadUrl } = await dispatch(_uploadItem({ uid, file }));

      // Send to streaming service.
      await dispatch(_sendToStreamingService({ uid, downloadUrl }));
      console.log('updateItem: complete');
    }
  }
);

const deleteItem = createAsyncThunk(
  'deleteItem',
  async ({ uid }, { dispatch, getState }) => {
    // dispatch(uiActions.resetDialog('deleteDialog'));
    const { deleteDialog } = uiSelectors.select(getState());
    // dispatch(uiActions.setUI({ deleteDialog: { ...deleteDialog, mode: MODES.PROCESSING }}));

    // try {
      const callable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.DELETE_ITEM);
      const result = await callable({ uid });
      // dispatch(uiActions.resetDialog('deleteDialog'));
      console.log(result);
    // } catch (error) {
      // dispatch(uiActions.setUI({ deleteDialog: { ...deleteDialog, mode: MODES.VIEW, error } }));
    // }
  }
);

const launchItem = createAsyncThunk(
  'launchItem',
  async ({ uid }) => {
    console.log('launch item', uid);
    const itemData = (await app.firestore().collection('items').doc(uid).get()).data();
    if (itemData.status !== 'scheduled') throw new Error(`Can't launch ${uid}: status is ${itemData.status}.`);

    await app.firestore().collection('items').doc(uid).update({ status: 'initializing' });
  }
);

/**
 * Ends a previously-launched live session.
 */
const endItem = createAsyncThunk(
  'endItem',
  async ({ uid }) => {
    console.log('end item', uid);
    const itemData = (await app.firestore().collection('items').doc(uid).get()).data();
    if (itemData.status !== 'live') throw new Error(`Can't end ${uid}: status is ${itemData.status}.`);

    await app.firestore().collection('items').doc(uid).update({ status: 'processing' });
  }
);

const onPending = name => (state) => {
  state[name].isLoading = true;
  state[name].error = null;
};

const onRejected = name => (state) => {
  state[name].isLoading = false;
  state[name].error = state.payload;
};

const onFulfilled = name => (state) => {
  state[name].isLoading = false;
};

const resetValue = name => (state) => {
  state[name] = initialState[name];
};

const mergeValue = name => (state, action) => {
  state[name] = { ...state[name], ...action.payload };
};

const { actions: generatedActions, reducer } = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    setTeaching: mergeValue('teaching'),
    resetTeaching: resetValue('teaching'),

    setLearning: mergeValue('learning'),
    resetLearning: resetValue('learning'),

    setTokens: setValue('tokens'),
    reset: reset(initialState)
  },
  extraReducers: {
    [createNewCourse.pending]: onPending('teaching'),
    [createNewCourse.rejected]: onRejected('teaching'),
    [createNewCourse.fulfilled]: onFulfilled('teaching'),

    [deleteCourse.pending]: onPending('teaching'),
    [deleteCourse.rejected]: onRejected('teaching'),
    [deleteCourse.fulfilled]: onFulfilled('teaching'),

    [createItem.pending]: onPending('teaching'),
    [createItem.rejected]: onPending('teaching'),
    [createItem.fulfilled]: onPending('teaching'),

    [deleteItem.pending]: onPending('teaching'),
    [deleteItem.rejected]: onPending('teaching'),
    [deleteItem.fulfilled]: onPending('teaching')
  }
});

const actions = {
  ...generatedActions,
  init,
  createNewCourse, updateCourse, deleteCourse,
  createItem, updateItem, deleteItem, launchItem, endItem
};

const select = ({ catalog }) => catalog;

const selectTokens = createSelector(select, ({ tokens }) => tokens);
const selectTeachingTokens = createSelector(selectTokens, tokens => {
  return tokens.filter(token => token.access === 'admin');
});
const selectLearningTokens = createSelector(selectTokens, tokens => {
  return tokens.filter(token => token.access === 'student')
});

const selectors = { select, selectTeachingTokens, selectLearningTokens };

export { actions, selectors };
export default reducer;
