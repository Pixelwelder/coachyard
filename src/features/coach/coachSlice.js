import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { loaderReducers, reset, setValue } from '../../util/reduxUtils';
import app from 'firebase/app';
import { parseUnserializables } from '../../util/firestoreUtils';
import { EventTypes } from '../../constants/analytics';
import { actions as uiActions2 } from '../ui/uiSlice2';
import { createTokenSelectors } from '../../util/storeUtils';

const name = 'coach';
const initialState = {
  isLoading: false,
  error: null,
  coach: null,
  courses: [],
  tokensByUid: {},
  students: [],
  provider: {}
};

let unsubscribeCoach = () => {}
let unsubscribeCourses = () => {};
let unsubscribeTokens = () => {};
const load = createAsyncThunk(
  `${name}/load`,
  async ({ slug, history }, { dispatch }) => {
    unsubscribeCoach();
    unsubscribeCourses();
    unsubscribeTokens();

    unsubscribeCoach = app.firestore().collection('users')
      .where('slug', '==', slug).limit(1)
      .onSnapshot((snapshot) => {
        console.log('coach.onSnapshot', slug, snapshot.size);
        if (snapshot.size) {
          // Coach found
          const coach = snapshot.docs[0].data();
          dispatch(generatedActions.setCoach(parseUnserializables(coach)));

          // Load courses.
          unsubscribeCourses = app.firestore().collection('courses')
            .where('creatorUid', '==', coach.uid)
            .where('isPublic', '==', true)
            .onSnapshot((snapshot) => {
              const courses = snapshot.docs.map(doc => parseUnserializables(doc.data()));
              dispatch(generatedActions.setCourses(courses));
            })

          unsubscribeTokens = app.firestore().collection('tokens')
            .where('user', '==', coach.uid)
            .where('isPublic', '==', true)
            .where('access', '==', 'admin')
            .onSnapshot((snapshot) => {
              const tokens = snapshot.docs
                .map(doc => parseUnserializables(doc.data()))
                .reduce((accum, token) => ({ ...accum, [token.uid]: token }), {});
              dispatch(generatedActions.setTokensByUid(tokens));
            })
        } else {
          history.push('/dashboard');
        }
      });
  }
);

const update = createAsyncThunk(
  `${name}/update`,
  async (update, { dispatch }) => {
    app.analytics().logEvent(EventTypes.UPDATE_USER);

    await app.functions().httpsCallable('updateOwnUser')(update);
    dispatch(uiActions2.editCoach.reset());
  }
);

const init = createAsyncThunk(
  `${name}/init`,
  async (_, { dispatch }) => {
    app.auth().onAuthStateChanged((authUser) => {
      if (!authUser) {
        // dispatch(generatedActions.reset());
      }
    })
  }
);

const { actions: generatedActions, reducer } = createSlice({
  name,
  initialState,
  reducers: {
    setCoach: setValue('coach'),
    setCourses: setValue('courses'),
    setTokensByUid: setValue('tokensByUid'),
    setProvider: setValue('provider'),
    reset: reset(initialState)
  },
  extraReducers: loaderReducers(name, initialState)
});

const actions = { ...generatedActions, load, update, init };

const select = ({ coach }) => coach;
const selectors = {
  select, ...createTokenSelectors(select)
};

export { actions, selectors };
export default reducer;
