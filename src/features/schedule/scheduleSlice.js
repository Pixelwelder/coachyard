import { createSlice, createSelector, createAsyncThunk } from '@reduxjs/toolkit';
import app from 'firebase/app';
import { loaderReducers, reset, setValue } from '../../util/reduxUtils';
import { easy } from '../../config';
import { selectors as selectedCourseSelectors } from '../course/selectedCourseSlice';

export const TABS = {
  CALENDAR: 0,
  WORKING_PLAN: 1,
  BREAKS: 2,
  EXCEPTIONS: 3
};

const name = 'schedule';
const initialState = {
  isInitialized: false,
  isReadyForLogin: false,
  numFailedLogins: 0,
  isLoggedIn: false,
  credentials: null,
  isLoading: false,
  services: [],
  provider: null,
  scheduleOpenCalendar: false,

  tab: TABS.WORKING_PLAN
};

const select = ({ schedule }) => schedule;
const selectWorkingPlan = createSelector(
  select,
  ({ provider }) => {
    const workingPlanObj = provider?.settings?.workingPlan;
    if (!workingPlanObj) return [];

    return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      .map(dayName => ({ ...workingPlanObj[dayName], name: dayName }));
  }
);
const selectors = { select, selectWorkingPlan };

const { reducer, actions: generatedActions } = createSlice({
  name,
  initialState,
  reducers: {
    setIsInitialized: setValue('isInitialized'),
    setIsReadyForLogin: setValue('isReadyForLogin'),
    setIsLoggedIn: setValue('isLoggedIn'),
    setNumFailedLogins: setValue('numFailedLogins'),
    setIsLoading: setValue('isLoading'),
    setCredentials: setValue('credentials'),
    setServices: setValue('services'),
    setProvider: setValue('provider'),
    setTab: setValue('tab'),
    setScheduleOpenCalendar: setValue('scheduleOpenCalendar'),
    reset: reset(initialState)
  },
  extraReducers: loaderReducers(name, initialState)
});

const openCalendar = createAsyncThunk(
  `${name}/openCalendar`,
  async (_, { dispatch, getState }) => {
    console.log('openCalendar');
    const { provider, scheduleOpenCalendar } = select(getState());
    if (!provider) {
      try {
        // Try to create, then return and wait for the data to come through a listener elsewhere.
        await app.functions().httpsCallable('createSchedulingUser')();
        dispatch(generatedActions.setScheduleOpenCalendar(true));
      } catch (error) {
        // Didn't work.
      }
      return;
    }

    if (scheduleOpenCalendar) {
      dispatch(generatedActions.setScheduleOpenCalendar(false));
    }

    let newWindow;
    const doLogin = () => {
      const { credentials, isReadyForLogin } = select(getState());
      if (!isReadyForLogin) {
        return;
      }

      if (!credentials) {
        return;
      }

      const { username, password } = credentials;
      newWindow.postMessage({ type: 'login', username, password }, '*');

      // const schedule = document.getElementById('schedule');
      // if (schedule) {
      //   schedule.contentWindow.postMessage(
      //     { type: 'login', username, password },
      //     '*'
      //   );
      //   dispatch(generatedActions.setNumFailedLogins(numFailedLogins + 1));
      // } else {
      //   console.log('No schedule iframe');
      // }
    };

    // Logs out of the scheduler.
    // const doLogout = () => {
    //   const schedule = document.getElementById('schedule');
    //   if (schedule) {
    //     document.getElementById('schedule').src = `${easy.url}/index.php/user/logout`
    //   } else {
    //     console.log('No schedule iframe');
    //   }
    // }

    // Listens for messages from scheduler login page.
    // TODO Log in after logging out
    const onMessage = (event) => {
      console.log('onMessage', event);
      if (event.data.type) {
        const { type, value } = event.data;
        switch (type) {
          case 'scheduler-login-ready': {
            console.log('scheduler login ready');
            const { isLoggedIn } = select(getState());
            if (!isLoggedIn) {
              dispatch(generatedActions.setIsReadyForLogin(value));
              if (value) {
                doLogin();
              }
            }
            break;
          }

          case 'schedule-login-is-loading': {
            dispatch(generatedActions.setIsLoading(value));
            break;
          }

          case 'scheduler-login-logged-in': {
            // const schedule = document.getElementById('schedule');
            // schedule.src = `${easy.url}/index.php/backend`;
            // dispatch(generatedActions.setIsLoggedIn(value));
            break;
          }

          default: {
            break;
          }
        }
      }
    };

    window.addEventListener('message', onMessage);
    newWindow = window.open(`${easy.url}/index.php/user/login`, 'calendar', 'left=100,right=100,width=900,height=600');
  }
);

let unsubscribeProviders = () => {};
const init = createAsyncThunk(
  `${name}/init`,
  async (_, { dispatch, getState }) => {
    const { isInitialized } = select(getState());
    if (isInitialized) return;

    dispatch(generatedActions.setIsLoading(true));

    app.auth().onAuthStateChanged((authUser) => {
      unsubscribeProviders();
      if (authUser) {
        const schedule = document.getElementById('schedule');
        if (schedule) schedule.src = `${easy.url}/index.php/user/login?admin`;

        unsubscribeProviders = app.firestore()
          .collection('easy_providers')
          .doc(authUser.uid)
          .onSnapshot(async (snapshot) => {
            if (snapshot.exists) {
              // We have credentials.
              // Is the scheduler ready?
              const { isLoggedIn } = select(getState());
              if (!isLoggedIn) {
                const data = snapshot.data();
                const { settings: { password } } = data;
                dispatch(generatedActions.setCredentials({ username: authUser.uid, password }));
                dispatch(generatedActions.setProvider(data));

                const { scheduleOpenCalendar } = getState();
                if (scheduleOpenCalendar) {
                  dispatch(openCalendar());
                }
              } else {
                // Already logged in.
              }
            }
          });
      } else {
        console.log('LOGGED OUT');
        dispatch(generatedActions.reset());
      }
    });
    dispatch(generatedActions.setIsInitialized(true));
  }
);

const getServices = createAsyncThunk(
  `${name}/getServices`,
  async (_, { dispatch }) => {
    const result = await app.functions().httpsCallable('getServices')();
    dispatch(generatedActions.setServices(result));
  }
);

const getProvider = createAsyncThunk(
  `${name}/getWorkingPlan`,
  async (_, { dispatch }) => {
    const { data } = await app.functions().httpsCallable('getProvider')();
    console.log('result', data);
    dispatch(generatedActions.setProvider(data));
  }
);

const openScheduler = createAsyncThunk(
  `${name}/openScheduler`,
  async (_, { getState }) => {
    const state = getState();
    const { course } = selectedCourseSelectors.select(state);
    const selectedItem = selectedCourseSelectors.selectSelectedItem(state);
    const { creatorUid } = course;
    const providerDoc = await app.firestore().collection('easy_providers').doc(creatorUid).get();
    const { id } = providerDoc.data();

    window.open(
      `${easy.url}/index.php?provider=${id}&course=${course.uid}&item=${selectedItem.uid}`,
      'calendar',
      'left=100,right=100,width=800,height=800'
    );
  }
);

const actions = {
  ...generatedActions, init, getServices, getProvider, openCalendar, openScheduler
};

export { actions, selectors };
export default reducer;
