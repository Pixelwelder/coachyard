import app from 'firebase/app';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  setValue,
  mergeValue,
  isPendingAction,
  isRejectedAction,
  isFulfilledAction,
  isThisPendingAction, isThisRejectedAction, isThisFulfilledAction
} from '../../util/reduxUtils';
import { parseUnserializables } from '../../util/firestoreUtils';

const name = 'billing2';
const initialState = {
  customerData: null,
  paymentMethods: [],
  payments: [],
  subscriptions: [],
  tiers: [],

  isLoading: false,

  // UI
  ui: {
    selectedTierId: 0,
    actualTierId: 0
  }
};

/**
 * Listen to payment methods and payments.
 */
let unsubscribeUser = () => {};
let unsubscribeStripeCustomer = () => {};
let unsubscribePayments = () => {};
let unsubscribePaymentMethods = () => {};
let unsubscribeSubscriptions = () => {};
const _startDataListeners = createAsyncThunk(
  `${name}/startDataListeners`,
  async (_, { dispatch }) => {
    const { uid } = app.auth().currentUser;
    const stripeUserDoc = app.firestore().collection('stripe_customers').doc(uid);

    unsubscribeStripeCustomer = stripeUserDoc
      .onSnapshot((snapshot) => {
        if (snapshot.exists) {
          const customerData = snapshot.data();
          dispatch(generatedActions.setCustomerData(parseUnserializables(customerData)));
          dispatch(_startDataListeners());

          unsubscribePaymentMethods = stripeUserDoc
            .collection('payment_methods')
            .onSnapshot((snapshot) => {
              const paymentMethods = snapshot.docs.map(doc => parseUnserializables(doc.data()));
              dispatch(generatedActions.setPaymentMethods(paymentMethods));
            });

          unsubscribePayments = stripeUserDoc
            .collection('payments')
            .onSnapshot((snapshot) => {
              const payments = snapshot.docs.map(doc => parseUnserializables(doc.data()));
              dispatch(generatedActions.setPayments(payments));
            });

          unsubscribeSubscriptions = stripeUserDoc
            .collection('subscriptions')
            .onSnapshot((snapshot) => {
              const subscriptions = snapshot.docs.map(doc => parseUnserializables(doc.data()));
              dispatch(generatedActions.setSubscriptions(subscriptions));
            });
        }
      });
  }
);

const _stopDataListeners = () => {
  unsubscribeStripeCustomer();
  unsubscribePaymentMethods();
  unsubscribePaymentMethods();
  unsubscribeSubscriptions();
};

const getTier = async (_authUser = null) => {
  const authUser = _authUser || app.auth().currentUser;
  if (!authUser) return 0;

  const { claims: { tier } } = await authUser.getIdTokenResult(true);
  return tier;
};

const setTier = createAsyncThunk(
  `${name}/setTier`,
  async (params) => {
    const { id: newTier } = params;
    const currentTier = await getTier();
    if (newTier === currentTier) return;

    await app.functions().httpsCallable('setTier')(params);
  }
);

const init = createAsyncThunk(
  `${name}/init`,
  async (_, { dispatch }) => {
    console.log('Billing2 actions: init')
    app.auth().onAuthStateChanged(async (authUser) => {
      unsubscribeUser();
      _stopDataListeners();

      if (authUser) {
        unsubscribeUser = app.firestore().collection('users').doc(authUser.uid)
          .onSnapshot(async (snapshot) => {
            // When the user changes, check the tier for billing purposes.
            const tier = await getTier();
            dispatch(generatedActions.setUI({ selectedTierId: tier, actualTierId: tier }));
          });

        _startDataListeners();

        // TODO This should probably go elsewhere. Preferably in Firestore so we get updates.
        const { data: tiers = [] } = await app.functions().httpsCallable('getTiers')();
        dispatch(generatedActions.setTiers(tiers));
      }
    })
  }
);

const { actions: generatedActions, reducer } = createSlice({
  name,
  initialState,
  reducers: {
    setCustomerData: setValue('customerData'),
    setPaymentMethods: setValue('paymentMethods'),
    setSubscriptions: setValue('subscriptions'),
    setPayments: setValue('payments'),
    setTiers: setValue('tiers'),

    setUI: mergeValue('ui')
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(isThisPendingAction(name), (state, action) => {
        console.log('PENDING', action);
        state.isLoading = true;
      })
      .addMatcher(isThisRejectedAction(name), state => { state.isLoading = false; })
      .addMatcher(isThisFulfilledAction(name), state => { state.isLoading = false; })
  },
});

const actions = { ...generatedActions, init, setTier };

const select = ({ billing2 }) => billing2;
const selectors = { select };

export { actions, selectors };
export default reducer;
