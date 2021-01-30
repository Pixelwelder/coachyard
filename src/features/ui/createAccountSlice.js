import { createUISlice } from './createUISlice';
import SESSION_MODES from '../../constants/sessionModes';

const initialState = {
  displayName: '',
  email: '',
  password: '',
  mode: SESSION_MODES.SIGN_UP
};

export default createUISlice({
  name: 'createAccount',
  extraNames: ['signIn', 'signUp'],

  initialState,
  builderFunc: (builder) => {
    builder.addMatcher(
      action => action.type === 'auth/stateChanged',
      (state, action) => {
        console.log('createAccountSlice', action.payload);
        state.isOpen = !action.payload;
      }
    );
  }
});
