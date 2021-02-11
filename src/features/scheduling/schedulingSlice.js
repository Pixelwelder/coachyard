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
              const result = await fetch(
                'http://localhost:8000/index.php/user/ajax_check_login',
                {
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                    // 'Content-Type': 'application/json; charset=utf-8'
                  },
                  method: 'post',
                  // mode: 'no-cors',
                  body: `username=${username}&password=${password}`
                }
              );

              const json = await result.json();
              console.log(json);
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
