import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { loaderReducers, setValue } from '../../util/reduxUtils';
import app from 'firebase/app';
import { parseUnserializables } from '../../util/firestoreUtils';

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
        if (snapshot.size) {
          // Coach found
          const coach = snapshot.docs[0].data();
          dispatch(generatedActions.setCoach(parseUnserializables(coach)));

          // Load courses.
          unsubscribeCourses = app.firestore().collection('courses')
            .where('creatorUid', '==', coach.uid)
            .where('type', '==', 'public')
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

const { actions: generatedActions, reducer } = createSlice({
  name,
  initialState,
  reducers: {
    setCoach: setValue('coach'),
    setCourses: setValue('courses')
  },
  extraReducers: loaderReducers(name, initialState)
});

const actions = { ...generatedActions, load };

const select = ({ coach }) => coach;
const selectors = { select };

export { actions, selectors };
export default reducer;
