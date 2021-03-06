import { createSlice, createSelector, createAsyncThunk } from '@reduxjs/toolkit';
import app from 'firebase/app';
import { loaderReducers, setValue } from '../../util/reduxUtils';

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
  isLoggedIn: false,
  credentials: null,
  isLoading: false,
  services: [],
  provider: null,

  tab: TABS.WORKING_PLAN,
};

let unsubscribeProviders = () => {};
const init = createAsyncThunk(
  `${name}/init`,
  async (_, { dispatch, getState }) => {
    const { isInitialized } = select(getState());
    if (isInitialized) return;

    dispatch(generatedActions.setIsLoading(true));

    // Logs into the scheduler.
    const doLogin = () => {
      console.log('doLogin...');
      const { credentials, isReadyForLogin } = select(getState());
      if (!isReadyForLogin) {
        console.log('Form is not ready for login');
        return;
      }

      if (!credentials) {
        console.log('No credentials.');
        return;
      }

      const { username, password } = credentials;
      console.log('doLogin', username, password);
      const schedule = document.getElementById('schedule');
      if (schedule) {
        schedule.contentWindow.postMessage(
          { type: 'login', username, password },
          'http://localhost:8000' // TODO
        );
      } else {
        console.log('No schedule iframe');
      }
    };

    // Logs out of the scheduler.
    const doLogout = () => {
      const schedule = document.getElementById('schedule');
      if (schedule) {
        document.getElementById('schedule').src = "http://localhost:8000/index.php/user/logout"
      } else {
        console.log('No schedule iframe');
      }
    }

    // Listens for messages from scheduler login page.
    // TODO Log in after logging out
    const onMessage = (event) => {
      if (event.data.type) {
        const { type, value } = event.data;
        switch (type) {
          case 'scheduler-login-ready': {
            const { isLoggedIn } = select(getState());
            if (!isLoggedIn) {
              dispatch(generatedActions.setIsReadyForLogin(value));
              if (value) {
                doLogin();
              }
            }
          }

          case 'schedule-login-is-loading': {
            dispatch(generatedActions.setIsLoading(value));
          }

          case 'scheduler-login-logged-in': {
            // dispatch(generatedActions.setIsLoggedIn(value));
          }

          default: {
            //
          }
        }
      }
    };
    window.addEventListener('message', onMessage);

    app.auth().onAuthStateChanged((authUser) => {
      unsubscribeProviders();
      if (authUser) {
        unsubscribeProviders = app.firestore()
          .collection('easy_providers')
          .doc(authUser.uid)
          .onSnapshot(async (snapshot) => {
            if (snapshot.exists) {
              // We have credentials.
              // Is the scheduler ready?
              const { isReadyForLogin, isLoggedIn } = select(getState());
              if (!isLoggedIn) {
                const data = snapshot.data();
                const { settings: { username, password } } = data;
                dispatch(generatedActions.setCredentials({ username: authUser.uid, password }));

                if (isReadyForLogin) {
                  doLogin();
                } else {
                  console.log('scheduler: not ready for login');
                }
              } else {
                console.log('scheduler: already logged in');
              }
            }
          });
      } else {
        console.log('LOGGED OUT');
        doLogout();
      }
    });
    dispatch(generatedActions.setIsInitialized(true));
  }
);

const getServices = createAsyncThunk(
  `${name}/getServices`,
  async (_, { dispatch }) => {
    const result = await app.functions().httpsCallable('getServices')();
    dispatch(generatedActions.setServices(result))
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

const { reducer, actions: generatedActions } = createSlice({
  name,
  initialState,
  reducers: {
    setIsInitialized: setValue('isInitialized'),
    setIsReadyForLogin: setValue('isReadyForLogin'),
    setIsLoggedIn: setValue('isLoggedIn'),
    setIsLoading: setValue('isLoading'),
    setCredentials: setValue('credentials'),
    setServices: setValue('services'),
    setProvider: setValue('provider'),
    setTab: setValue('tab')
  },
  extraReducers: loaderReducers(name, initialState)
});

const actions = { ...generatedActions, init, getServices, getProvider };

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

export { actions, selectors };
export default reducer;
