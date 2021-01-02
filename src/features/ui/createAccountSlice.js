import { createUISlice } from './createUISlice';
import SESSION_MODES from '../session/sessionModes';

const initialState = {
  displayName: '',
  email: '',
  password: '',
  mode: SESSION_MODES.SIGN_IN
};

export default createUISlice({
  name: 'createAccount',
  initialState,
  builderFunc: (builder) => {
    builder.addMatcher(
      action => action.type === 'auth/stateChanged',
      (state, action) => {
        console.log('AUTH CHANGED');
        state.isOpen = !action.payload;
      }
    );
  }
});
