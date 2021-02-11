import { createSlice, createSelector, createAsyncThunk } from '@reduxjs/toolkit';
import app from 'firebase/app';

const name = 'scheduling';
const initialState = {};

let unsubscribeProviders = () => {};
const init = createAsyncThunk(
  `${name}/init`,
  async () => {
    app.auth().onAuthStateChanged((authUser) => {
      unsubscribeProviders();
      if (authUser) {
        unsubscribeProviders = app.firestore()
          .collection('easy_providers')
          .doc(authUser.uid)
          .onSnapshot(async (snapshot) => {
            if (snapshot.exists) {
              // TODO TODO TODO for the love of everything TODO
              const data = snapshot.data();
              const { settings: { username, password } } = data;
              console.log('--', username, password);
              setTimeout(() => {
                console.log('POSTING', username, password);
                document.getElementById('scheduling').contentWindow.postMessage(
                  { type: 'login', username, password },
                  'http://localhost:8000'
                );
              }, 5000);
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
  }
);

const { reducer, actions: generatedActions } = createSlice({
  name,
  initialState
});

const actions = { ...generatedActions, init };

const select = ({ scheduling }) => scheduling;
const selectors = { select };

export { actions, selectors };
export default reducer;
