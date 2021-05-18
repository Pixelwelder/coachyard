import app from 'firebase/app';
import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import {
  setValue,
  mergeValue,
  isThisPendingAction, isThisRejectedAction, isThisFulfilledAction, resetValue,
} from '../../util/reduxUtils';
import { parseUnserializables } from '../../util/firestoreUtils';
import { EventTypes } from '../../constants/analytics';
import { selectors as selectedCourseSelectors } from '../course/selectedCourseSlice';

const name = 'billing';
const initialState = {
  customerData: null,
  paymentMethods: [],
  payments: [],
  subscriptions: [],
  sessions: [],

  tiers: [],
  tier: 0,

  isLoading: false,

  // UI
  ui: {
    showBilling: false,
    selectedTierId: 0,
    billingIsComplete: false,

    showUnlock: false,
    unlockIsComplete: false,
  },
};

/**
 * Listen to payment methods and payments.
 */
let unsubscribeUser = () => {};
let unsubscribeStripeCustomer = () => {};
let unsubscribePayments = () => {};
let unsubscribePaymentMethods = () => {};
let unsubscribeSubscriptions = () => {};
const unsubscribeSessions = () => {};
let unsubscribeUnlocked = () => {};
const _startDataListeners = createAsyncThunk(
  `${name}/startDataListeners`,
  async (_, { dispatch }) => {
    const { uid } = app.auth().currentUser;
    const stripeUserDoc = app.firestore().collection('stripe_customers').doc(uid);

    unsubscribeStripeCustomer = stripeUserDoc
      .onSnapshot((snapshot) => {
        console.log('stripe customer', snapshot.exists);
        if (snapshot.exists) {
          const customerData = snapshot.data();
          dispatch(generatedActions.setCustomerData(parseUnserializables(customerData)));

          unsubscribePaymentMethods = stripeUserDoc
            .collection('payment_methods')
            .onSnapshot((snapshot) => {
              const paymentMethods = snapshot.docs.map((doc) => parseUnserializables(doc.data()));
              dispatch(generatedActions.setPaymentMethods(paymentMethods));
            });

          unsubscribePayments = stripeUserDoc
            .collection('payments')
            .onSnapshot((snapshot) => {
              const payments = snapshot.docs.map((doc) => parseUnserializables(doc.data()));
              dispatch(generatedActions.setPayments(payments));
            });

          unsubscribeSubscriptions = stripeUserDoc
            .collection('subscriptions')
            .onSnapshot((snapshot) => {
              const subscriptions = snapshot.docs.map((doc) => parseUnserializables(doc.data()));
              dispatch(generatedActions.setSubscriptions(subscriptions));
            });

          // console.log('unsubscribeSessions');
          // const { course } = selectedCourseSelectors.select(getState());
          // unsubscribeSessions = stripeUserDoc
          //   .collection('sessions')
          //   .onSnapshot((snapshot) => {
          //     console.log('sessions', snapshot.docs);
          //     snapshot.docChanges().forEach((change) => {
          //       if (change.type === 'modified') {
          //         // Here we go.
          //
          //       }
          //     })
          //     const sessions = snapshot.docs.map(doc => parseUnserializables(doc.data()));
          //     dispatch(generatedActions.setSessions(sessions));
          //   });

          unsubscribeUnlocked = stripeUserDoc
            .collection('unlocked')
            .onSnapshot((snapshot) => {
              const unlocked = snapshot.docs.map((doc) => parseUnserializables());
            });
        }
      });
  },
);

const _stopDataListeners = () => {
  unsubscribeStripeCustomer();
  unsubscribePaymentMethods();
  unsubscribePaymentMethods();
  unsubscribeSubscriptions();
  unsubscribeSessions();
  unsubscribeUnlocked();
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
  },
);

const _addPaymentMethod = createAsyncThunk(
  '_addPaymentMethod',
  async ({ stripe, card }) => {
    app.analytics().logEvent(EventTypes.ADD_PAYMENT_METHOD_ATTEMPTED);
    const paymentMethodResult = await stripe.createPaymentMethod({
      type: 'card',
      card,
    });

    if (paymentMethodResult.error) {
      throw new Error(paymentMethodResult.error);
    }

    const { paymentMethod } = paymentMethodResult;
    console.log('payment method created', paymentMethodResult.paymentMethod);

    // Send it to the server.
    await app.functions().httpsCallable('createPaymentMethod')({ id: paymentMethod.id });
    app.analytics().logEvent(EventTypes.ADD_PAYMENT_METHOD);

    // Save the payment method.
    // const { uid } = app.auth().currentUser;
    // await app.firestore()
    //   .collection('stripe_customers')
    //   .doc(uid)
    //   .collection('payment_methods')
    //   .doc(paymentMethod.id)
    //   .set({ id: paymentMethod.id }, { merge: true });

    console.log('Payment method saved.');
  },
);

const unlockCourse = createAsyncThunk(
  `${name}/unlockCourse`,
  async ({ stripe, card }, { dispatch, getState }) => {
    const state = getState();
    const { course } = selectedCourseSelectors.select(state);
    console.log('unlocking', course.uid);

    // const { paymentMethods, ui: { selectedTierId } } = select(getState());
    // // First create a payment method with the provided card.
    // if (!paymentMethods.length) {
    //   console.log('No payment method. Creating.');
    //   if (!card) throw new Error('No payment methods, and no card provided.');
    //   await dispatch(_addPaymentMethod({ stripe, card }));
    // }

    // Start the purchase session, then redirect.
    console.log('Unlocking...');
    const { data: { sessionId } } = await app.functions().httpsCallable('initializePurchase')({
      uid: course.uid,
      url: window.location.href,
    });
    console.log('sessionId', sessionId);
    stripe.redirectToCheckout({ sessionId });

    console.log('Unlocking complete');
  },
);

const createSubscription = createAsyncThunk(
  `${name}/createSubscription`,
  async ({ stripe, card }, { dispatch, getState }) => {
    console.log('Billing: createSubscription', stripe, card);

    const { paymentMethods, ui: { selectedTierId } } = select(getState());

    // First create a payment method with the provided card.
    if (!paymentMethods.length) await dispatch(_addPaymentMethod({ stripe, card }));

    // Now create the order.
    console.log(`ordering ${selectedTierId}...`);
    app.analytics().logEvent(EventTypes.CREATE_SUBSCRIPTION_ATTEMPTED, { tier: selectedTierId });
    await app.functions().httpsCallable('createSubscription')({ tier: selectedTierId });
    app.analytics().logEvent(EventTypes.CREATE_SUBSCRIPTION, { tier: selectedTierId });
    console.log('order complete');

    dispatch(generatedActions.resetUI());
  },
);

const updateSubscription = createAsyncThunk(
  `${name}/updateSubscription`,
  async (_, { getState }) => {
    console.log('update subscription');
    const { ui: { selectedTierId } } = select(getState());
    app.analytics().logEvent(EventTypes.UPDATE_SUBSCRIPTION_ATTEMPTED, { tier: selectedTierId });
    await app.functions().httpsCallable('updateSubscription')({ id: selectedTierId });
    app.analytics().logEvent(EventTypes.UPDATE_SUBSCRIPTION, { tier: selectedTierId });
    console.log('subscription updated');
  },
);

const cancelSubscription = createAsyncThunk(
  `${name}/cancelSubscription`,
  async (_, { getState, dispatch }) => {
    const active = selectSubscription(getState());
    if (!active) {
      console.error('No subscription to cancel.');
      throw new Error('No subscription to cancel.');
    }

    const { id } = active;
    app.analytics().logEvent(EventTypes.UPDATE_SUBSCRIPTION_ATTEMPTED);
    await app.functions().httpsCallable('cancelSubscription')({ id });
    app.analytics().logEvent(EventTypes.UPDATE_SUBSCRIPTION);
  },
);

const init = createAsyncThunk(
  `${name}/init`,
  async (_, { dispatch }) => {
    app.auth().onAuthStateChanged(async (authUser) => {
      unsubscribeUser();
      _stopDataListeners();

      if (authUser) {
        unsubscribeUser = app.firestore().collection('users').doc(authUser.uid)
          .onSnapshot(async (snapshot) => {
            // When the user changes, check the tier for billing purposes.
            const tier = await getTier();
            dispatch(generatedActions.setUI({ selectedTierId: tier }));
            dispatch(generatedActions.setTier(tier));
          });

        dispatch(_startDataListeners());

        // TODO This should probably go elsewhere. Preferably in Firestore so we get updates.
        const { data: tiers = [] } = await app.functions().httpsCallable('getTiers')();
        dispatch(generatedActions.setTiers(tiers));
      } else {
        dispatch(generatedActions.resetAll());
      }
    });
  },
);

const { actions: generatedActions, reducer } = createSlice({
  name,
  initialState,
  reducers: {
    setCustomerData: setValue('customerData'),
    setPaymentMethods: setValue('paymentMethods'),
    setSubscriptions: setValue('subscriptions'),
    setPayments: setValue('payments'),
    setSessions: setValue('sessions'),
    setTiers: setValue('tiers'),
    setTier: setValue('tier'),

    setUI: mergeValue('ui'),
    resetUI: resetValue('ui', initialState.ui),
    resetAll: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(isThisPendingAction(name), (state, action) => {
        state.isLoading = true;
      })
      .addMatcher(isThisRejectedAction(name), (state, action) => {
        state.isLoading = false;
      })
      .addMatcher(isThisFulfilledAction(name), (state, action) => {
        state.isLoading = false;
      });
  },
});

const actions = {
  ...generatedActions,
  init,
  setTier,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  unlockCourse,
};

const select = ({ billing }) => billing;
/**
 * Returns the first active subscription.
 */
const selectSubscription = createSelector(select, ({ subscriptions }) => {
  if (!subscriptions.length) return null;
  const active = subscriptions.find(({ status }) => status === 'active');
  return active === undefined ? null : active;
});
const selectTier = createSelector(select, ({ tiers, tier }) => tiers[tier - 1]);
const selectSessionsByCourseUid = createSelector(
  select,
  ({ sessions }) => {
    console.log('reducing sessions', sessions);
    return sessions.reduce((accum, session) => {
      console.log('accum', accum);
      if (!accum[session.courseUid]) accum[session.courseUid] = [];
      console.log('added array');
      accum[session.courseUid].push(session.session);
      console.log();
    }, {});
  },
);
const selectors = {
  select, selectSubscription, selectTier, selectSessionsByCourseUid,
};

export { actions, selectors };
export default reducer;
