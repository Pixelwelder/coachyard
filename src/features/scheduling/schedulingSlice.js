import { createSlice, createSelector, createAsyncThunk } from '@reduxjs/toolkit';
import app from 'firebase/app';
import { setValue } from '../../util/reduxUtils';

const name = 'scheduling';
const initialState = {
  isInitialized: false,
  isReadyForLogin: false,
  isLoggedIn: false,
  credentials: null,
  isLoading: false,
  services: []
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
      document.getElementById('scheduling').contentWindow.postMessage(
        { type: 'login', username, password },
        'http://localhost:8000' // TODO
      );
    };

    // Listens for messages from scheduler login page.
    const onMessage = (event) => {
      if (event.data.type) {
        const { type, value } = event.data;
        console.log('?', type, value);
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
        console.log('scheduling: login');
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
                console.log('+', data);
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

              // setTimeout(() => {
              //   console.log('POSTING', username, password);
              //   document.getElementById('scheduling').contentWindow.postMessage(
              //     { type: 'login', username, password },
              //     'http://localhost:8000'
              //   );
              // }, 5000);
              // const result = await fetch(
              //   'http://localhost:8000/index.php/user/ajax_check_login',
              //   {
              //     headers: {
              //       'Content-Type': 'application/x-www-form-urlencoded'
              //     },
              //     method: 'POST',
              //     body: `username=${username}&password=${password}`
              //   }
              // );
              // document.getElementById("scheduling").src = 'http://localhost:8000/index.php/backend/index';
              // const json = await result.json();
              // if (json === 'SUCCESS') {
              //   // document.getElementById("scheduling").src = 'http://localhost:8000/index.php/backend/index';
              //   // window.location.href = 'http://localhost:8000/index.php/backend/index';
              // } else {
              //   console.log(json);
              // }
            }
          });
      }
    });
    dispatch(generatedActions.setIsInitialized(true));
  }
);

const getServices = createAsyncThunk(
  `${name}/getServices`,
  async (_, { dispatch }) => {
    console.log('getServices');
    try {
      console.log('trying');
      const result = await app.functions().httpsCallable('getServices')();
      dispatch(generatedActions.setServices(result))
      console.log(result);
    } catch (error) {
      console.error(error);
    }
    console.log('done');
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
    setServices: setValue('services')
  }
});

const actions = { ...generatedActions, init, getServices };

const select = ({ scheduling }) => scheduling;
const selectors = { select };

export { actions, selectors };
export default reducer;
