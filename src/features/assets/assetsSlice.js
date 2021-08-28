import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import app from 'firebase/app';
import { loaderReducers, mergeValue, setValue } from '../../util/reduxUtils';

const initialState = {
  images: {},
  dirtyFlags: {} // Same keys as images.
};
const name = 'assets';

const getAsset = createAsyncThunk(
  `${name}/getAsset`,
  async ({ path }, { dispatch, getState }) => {
    const { images, dirtyFlags } = select(getState());
    if (images[path]) return images[path];
    try {
      const downloadUrl = await app.storage().ref(path).getDownloadURL();
      dispatch(generatedActions.addUrl({ [path]: downloadUrl }));

      const { [path]: dirtyFlag = 0 } = dirtyFlags;
      dispatch(generatedActions.setDirtyFlags({ [path]: dirtyFlag + 1 }));
    } catch (error) {
      // Don't show these.
      console.error(error);
    }
  },
);

const uploadAssets = createAsyncThunk(
  `${name}/uploadAsset`,
  async ({ filesByName }, { dispatch, getState }) => {
    console.log('uploading assets...', filesByName);
    const { dirtyFlags } = select(getState());
    const uploads = Object.entries(filesByName).map(async ([path, file]) => {
      await app.storage().ref().child(path).put(file);
      const { [path]: dirtyFlag = 0 } = dirtyFlags;
      dispatch(generatedActions.setDirtyFlags({ [path]: dirtyFlag + 1 }));
    });

    const result = await Promise.all(uploads);
    console.log('uploaded');
  }
);

const { actions: generatedActions, reducer } = createSlice({
  name,
  initialState,
  reducers: {
    addUrl: (state, action) => {
      state.images = { ...state.images, ...action.payload };
    },
    setDirtyFlags: mergeValue('dirtyFlags')
  },
  extraReducers: loaderReducers(name, initialState),
});

const actions = { ...generatedActions, getAsset, uploadAssets };

const select = ({ assets }) => assets;
const selectors = { select };

export { actions, selectors };
export default reducer;
