import app from 'firebase/app';
import { createSlice, createSelector, combineReducers, createAsyncThunk } from '@reduxjs/toolkit';
import { createUISlice } from '../ui/createUISlice';
import { setValue } from '../../util/reduxUtils';

const initialState = {
  // UI
  selectedTierId: 0,
  actualTierId: 0
};

let unsubscribe = () => {};
const init = createAsyncThunk(
  'initBilling2',
  async (_, { dispatch }) => {
    console.log('Billing2 actions: init')
    app.auth().onAuthStateChanged((authUser) => {
      unsubscribe();
      if (authUser) {
        unsubscribe = app.firestore().collection('users').doc(authUser.uid).onSnapshot((snapshot) => {
          // TODO Custom claims.
          const tier = snapshot.exists ? snapshot.data().tier : 0;
          dispatch(generatedActions.setSelectedTierId(tier));
          dispatch(generatedActions.setActualTierId(tier));
        });
      }
    })
  }
);

const setTier = createAsyncThunk(
  'setTier',
  async (params) => {
    await app.functions().httpsCallable('setTier')(params);
  }
);

const { actions: generatedActions, reducer } = createSlice({
  name: 'billing2',
  initialState,
  reducers: {
    setSelectedTierId: setValue('selectedTierId'),
    setActualTierId: setValue('actualTierId')
  }
});

const actions = { ...generatedActions, init, setTier };

const select = ({ billing2 }) => billing2;

/**
 * Gets all available tiers, including names and descriptions.
 * TODO From backend.
 */
const selectTiers = createSelector(select, () => {
  return [
    // { id: 0, displayName: 'Student', price: 0, period: 'forever', unitsName: 'hours', unitsAmount: 'unlimited' },
    { id: 1, displayName: 'Coach', price: 29.95, period: 'per month', unitsName: 'hours', unitsAmount: '18' },
    { id: 2, displayName: 'Mentor', price: 69.95, period: 'per month', unitsName: 'hours', unitsAmount: '60' },
    { id: 3, displayName: 'Guru', price: 99.95, period: 'per month', unitsName: 'hours', unitsAmount: '160' }
  ];
});

/**
 * Selects the user's current official billing tier.
 */
const selectUserTier = createSelector(select, ({ actualTierId }) => {
  return actualTierId;
});

const selectors = { select, selectTiers, selectUserTier };

export { actions, selectors };
export default reducer;
