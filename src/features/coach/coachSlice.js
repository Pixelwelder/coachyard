import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { loaderReducers, reset, setValue } from '../../util/reduxUtils';
import app from 'firebase/app';
import { parseUnserializables } from '../../util/firestoreUtils';
import { EventTypes } from '../../constants/analytics';
import { actions as uiActions2 } from '../ui/uiSlice2';

const name = 'coach';
const initialState = {
  isLoading: false,
  error: null,
  coach: null,
  courses: [],
  tokens: [],
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
            .where('type', 'in', ['public', 'template'])
            .onSnapshot((snapshot) => {
              const courses = snapshot.docs.map(doc => parseUnserializables(doc.data()));
              dispatch(generatedActions.setCourses(courses));
            })

          unsubscribeTokens = app.firestore().collection('tokens')
            .where('user', '==', coach.uid)
            .where('type', 'in', ['public', 'template'])
            .where('access', '==', 'admin')
            .onSnapshot((snapshot) => {
              const tokens = snapshot.docs.map(doc => parseUnserializables(doc.data()));
              dispatch(generatedActions.setTokens(tokens));
            })
        } else {
          history.push('/dashboard');
        }
      });
  }
);

const update = createAsyncThunk(
  `${name}/update`,
  async ({ description }, { dispatch }) => {
    app.analytics().logEvent(EventTypes.UPDATE_USER);

    await app.firestore()
      .collection('users')
      .doc(app.auth().currentUser.uid)
      .update({
        description
      });

    dispatch(uiActions2.editCoach.reset());
  }
);

const init = createAsyncThunk(
  `${name}/init`,
  async (_, { dispatch }) => {
    app.auth().onAuthStateChanged((authUser) => {
      console.log('LOGGED OUT');
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
    setTokens: setValue('tokens'),
    setProvider: setValue('provider'),
    reset: reset(initialState)
  },
  extraReducers: loaderReducers(name, initialState)
});

const actions = { ...generatedActions, load, update, init };

const createTypeFilter = type => ({ tokens }) => tokens.filter(token => token.type === type);
const createNegativeTypeFilter = type => ({ tokens }) => tokens.filter(token => token.type !== type);
const select = ({ coach }) => coach;
const selectPublicTokens = createSelector(select, createTypeFilter('public'));
const selectTemplateTokens = createSelector(select, createTypeFilter('template'));
const selectNonTemplateTokens = createSelector(select, createNegativeTypeFilter('template'));
const selectors = { select, selectPublicTokens, selectTemplateTokens, selectNonTemplateTokens };

export { actions, selectors };
export default reducer;
