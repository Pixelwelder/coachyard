import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { loaderReducers, setValue } from '../../util/reduxUtils';
import app from 'firebase/app';
import { parseUnserializables } from '../../util/firestoreUtils';

const name = 'coach';
const initialState = {
  isLoading: false,
  error: null,
  coach: null
};

const load = createAsyncThunk(
  `${name}/load`,
  async ({ slug, history }, { dispatch }) => {
    const coaches = await app.firestore().collection('users')
      .where('slug', '==', slug).limit(1)
      .get();

    if (coaches.size) {
      // Coach found
      const coach = coaches.docs[0].data();
      dispatch(generatedActions.setCoach(parseUnserializables(coach)));
    } else {
      history.push('/dashboard');
    }
  }
);

const { actions: generatedActions, reducer } = createSlice({
  name,
  initialState,
  reducers: {
    setCoach: setValue('coach')
  },
  extraReducers: loaderReducers(name, initialState)
});

const actions = { ...generatedActions, load };

const select = ({ coach }) => coach;
const selectors = { select };

export { actions, selectors };
export default reducer;
