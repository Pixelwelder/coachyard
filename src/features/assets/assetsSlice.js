import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import app from 'firebase';
import { loaderReducers } from '../../util/reduxUtils';

const initialState = {
  //
};
const name = 'assets';

const getAsset = createAsyncThunk(
  `${name}/getAsset`,
  async ({ path }, { dispatch, getState }) => {
    const state = getState();
    if (state[path]) return state[path];

    const downloadUrl = await app.storage().ref(path).getDownloadURL();
    console.log('got url for path', path, downloadUrl);
    dispatch(generatedActions.addUrl({ [path]: downloadUrl }));
  }
);

const { actions: generatedActions, reducer } = createSlice({
  name,
  initialState,
  reducers: {
    addUrl: (state, action) => ({
      ...state,
      ...action.payload
    })
  },
  extraReducers: loaderReducers(name, initialState)
});

const actions = { ...generatedActions, getAsset };

const select = ({ assets }) => assets;
const selectors = { select };

export { actions, selectors };
export default reducer;
