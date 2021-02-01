import app from 'firebase/app';
import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import {
  setValue,
  mergeValue,
  isThisPendingAction, isThisRejectedAction, isThisFulfilledAction, resetValue
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
  tier: 0,

  isLoading: false,

  // UI
  ui: {
    showBilling: false,
    selectedTierId: 0
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
    console.log('billing2.startDataListeners');
    const { uid } = app.auth().currentUser;
    const stripeUserDoc = app.firestore().collection('stripe_customers').doc(uid);

    unsubscribeStripeCustomer = stripeUserDoc
      .onSnapshot((snapshot) => {
        if (snapshot.exists) {
          const customerData = snapshot.data();
          dispatch(generatedActions.setCustomerData(parseUnserializables(customerData)));

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

  const { claims: { tier = 0 } } = await authUser.getIdTokenResult(true);
  return tier;
};

const setTier = createAsyncThunk(
  `${name}/setTier`,
  async (params, { getState }) => {
    const { paymentMethods } = select(getState());
    if (!paymentMethods.length) throw new Error('No payment methods!');

    const { id: newTier } = params;
    const currentTier = await getTier();
    if (newTier === currentTier) return;

    // TODO Reconsider.
    await app.functions().httpsCallable('setTier')(params);
  }
);

const createSubscription = createAsyncThunk(
  `${name}/createSubscription`,
  async ({ stripe, card }, { dispatch, getState }) => {
    console.log('Billing: createSubscription', stripe, card);

    const { paymentMethods, ui: { selectedTierId } } = select(getState());

    // First create a payment method with the provided card.
    if (!paymentMethods.length) {
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

      // Save the payment method.
      const { uid } = app.auth().currentUser;
      const result = await app.firestore()
        .collection('stripe_customers')
        .doc(uid)
        .collection('payment_methods')
        .doc(paymentMethod.id)
        .set({ id: paymentMethod.id }, { merge: true });

      console.log('Payment method saved.');
    }

    // Now create the order.
    console.log('ordering...');
    await app.functions().httpsCallable('setTier')({ id: selectedTierId });
    console.log('order complete');

    dispatch(generatedActions.resetUI());
  }
);

const updateSubscription = createAsyncThunk(
  `${name}/updateSubscription`,
  async ({ stripe, card }) => {
    console.log('update subscription');
  }
)

const cancelSubscription = createAsyncThunk(
  `${name}/cancelSubscription`,
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

    // dispatch(generatedActions.resetUI());
  }
);

const init = createAsyncThunk(
  `${name}/init`,
  async (_, { dispatch }) => {
    app.auth().onAuthStateChanged(async (authUser) => {
      unsubscribeUser();
      _stopDataListeners();

      console.log('billing2: auth changed', authUser);
      if (authUser) {
        unsubscribeUser = app.firestore().collection('users').doc(authUser.uid)
          .onSnapshot(async (snapshot) => {
            // When the user changes, check the tier for billing purposes.
            console.log('billing2: user snapshot');
            const tier = await getTier();
            console.log('billing2: tier', tier);
            dispatch(generatedActions.setUI({ selectedTierId: tier }));
            dispatch(generatedActions.setTier(tier));
          });

        dispatch(_startDataListeners());

        // TODO This should probably go elsewhere. Preferably in Firestore so we get updates.
        const { data: tiers = [] } = await app.functions().httpsCallable('getTiers')();
        dispatch(generatedActions.setTiers(tiers));
      } else {
        dispatch(generatedActions.resetUI());
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
    setTier: setValue('tier'),

    setUI: mergeValue('ui'),
    resetUI: resetValue('ui', initialState.ui)
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

const actions = { ...generatedActions, init, setTier, createSubscription, updateSubscription, cancelSubscription };

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
