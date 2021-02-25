import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { loaderReducers, setValue } from '../../util/reduxUtils';
import app from 'firebase/app';
import { parseUnserializables } from '../../util/firestoreUtils';
import { EventTypes } from '../../constants/analytics';
import { actions as uiActions2 } from '../ui/uiSlice2';

const name = 'coach';
const initialState = {
  isLoading: false,
  error: null,
  coach: null,
  courses: []
};

let unsubscribeCoach = () => {}
let unsubscribeCourses = () => {};
const load = createAsyncThunk(
  `${name}/load`,
  async ({ slug, history }, { dispatch }) => {
    unsubscribeCoach();
    unsubscribeCourses();

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
              const courses = snapshot.docs.map((doc => parseUnserializables(doc.data())));
              dispatch(generatedActions.setCourses(courses));
            })
        } else {
          history.push('/dashboard');
        }
      })
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

const { actions: generatedActions, reducer } = createSlice({
  name,
  initialState,
  reducers: {
    setCoach: setValue('coach'),
    setCourses: setValue('courses')
  },
  extraReducers: loaderReducers(name, initialState)
});

const actions = { ...generatedActions, load, update };

const createTypeFilter = type => ({ courses }) => courses.filter(course => course.type === type);
const select = ({ coach }) => coach;
const selectPublicCourses = createSelector(select, createTypeFilter('public'));
const selectTemplateCourses = createSelector(select, createTypeFilter('template'));
const selectors = { select, selectPublicCourses, selectTemplateCourses };

export { actions, selectors };
export default reducer;
