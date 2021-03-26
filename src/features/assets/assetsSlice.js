import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import app from 'firebase';
import { loaderReducers } from '../../util/reduxUtils';

const initialState = {
  images: {}
};
const name = 'assets';

const getAsset = createAsyncThunk(
  `${name}/getAsset`,
  async ({ path }, { dispatch, getState }) => {
    const { images } = select(getState());
    if (images[path]) return images[path];
    const downloadUrl = await app.storage().ref(path).getDownloadURL();
    dispatch(generatedActions.addUrl({ [path]: downloadUrl }));
  }
);

const { actions: generatedActions, reducer } = createSlice({
  name,
  initialState,
  reducers: {
    addUrl: (state, action) => {
      state.images = { ...state.images, ...action.payload };
    }
  },
  extraReducers: loaderReducers(name, initialState)
});

const actions = { ...generatedActions, getAsset };

const select = ({ assets }) => assets;
const selectors = { select };

export { actions, selectors };
export default reducer;
