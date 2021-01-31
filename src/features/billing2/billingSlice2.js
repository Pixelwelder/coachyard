import app from 'firebase/app';
import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import {
  setValue,
  mergeValue,
  isPendingAction,
  isRejectedAction,
  isFulfilledAction,
  isThisPendingAction, isThisRejectedAction, isThisFulfilledAction
} from '../../util/reduxUtils';
import { parseUnserializables } from '../../util/firestoreUtils';
import { CALLABLE_FUNCTIONS } from '../../app/callableFunctions';

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
    showBilling: false,
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

const createSubscription = createAsyncThunk(
  'createSubscription',
  async ({ stripe, card }, { getState }) => {
    console.log('Billing: createSubscription', stripe, card);

    // First create a payment method with the provided card.
    const paymentMethodResult = await stripe.createPaymentMethod({
      type: 'card',
      card
    });

    if (paymentMethodResult.error) {
      console.error(paymentMethodResult.error);
      throw new Error(paymentMethodResult.error);
    }

    const { paymentMethod } = paymentMethodResult;
    console.log('payment method created', paymentMethodResult.paymentMethod);

    const { ui: { selectedTierId } } = select(getState());
    // Save the payment method.
    const { uid } = app.auth().currentUser;
    const result = await app.firestore()
      .collection('stripe_customers')
      .doc(uid)
      .collection('payment_methods')
      .doc(paymentMethod.id)
      .set({ id: paymentMethod.id, tier: selectedTierId });

    console.log('Payment method saved.');
  }
);

const cancelSubscription = createAsyncThunk(
  'cancelSubscription',
  async (_, { getState, dispatch }) => {
    const active = selectSubscription(getState());
    if (!active) {
      console.error('No subscription to cancel.');
      throw new Error('No subscription to cancel.');
    }

    const { id } = active;
    const callable = app.functions().httpsCallable(CALLABLE_FUNCTIONS.STRIPE_CANCEL_SUBSCRIPTION);
    await callable({ id });
    // const result = await app.firestore()
    //   .collection('stripe_customers')
    //   .doc(app.auth().currentUser.uid)
    //   .collection('subscriptions')
    //   .doc(id)
    //   .update({ pending_action: 'cancel' });

    dispatch(generatedActions.resetUI());
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

const actions = { ...generatedActions, init, setTier, createSubscription, cancelSubscription };

const select = ({ billing2 }) => billing2;
/**
 * Returns the first active subscription.
 */
const selectSubscription = createSelector(select, ({ subscriptions }) => {
  if (!subscriptions.length) return null;
  const active = subscriptions.find(({ status }) => status === 'active');
  return active === undefined ? null : active;
});
const selectors = { select, selectSubscription };

export { actions, selectors };
export default reducer;
