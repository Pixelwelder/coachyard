import app from 'firebase/app';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { parseUnserializables } from '../../util/firestoreUtils';
import { CALLABLE_FUNCTIONS } from '../../app/callableFunctions';
import { reset } from '../../util/reduxUtils';

const initialState = {
  customerData: null,
  paymentMethods: [],
  payments: [],
  subscriptions: [],

  ui: {
    showConfirmCancel: false,
    isLoading: false
  }
};

/**
 * Listen to payment methods and payments.
 */
let unsubscribePayments = () => {};
let unsubscribePaymentMethods = () => {};
let unsubscribeSubscriptions = () => {};
const _startDataListeners = createAsyncThunk(
  'startDataListeners',
  async (_, { dispatch }) => {
    const { uid } = app.auth().currentUser;
    const userDoc = app.firestore().collection('stripe_customers').doc(uid);

    unsubscribePaymentMethods = userDoc
      .collection('payment_methods')
      .onSnapshot((snapshot) => {
        const paymentMethods = snapshot.docs.map(doc => parseUnserializables(doc.data()));
        dispatch(generatedActions.setPaymentMethods(paymentMethods));
      });

    unsubscribePayments = userDoc
      .collection('payments')
      .onSnapshot((snapshot) => {
        const payments = snapshot.docs.map(doc => parseUnserializables(doc.data()));
        dispatch(generatedActions.setPayments(payments));
      });

    unsubscribeSubscriptions = userDoc
      .collection('subscriptions')
      .onSnapshot((snapshot) => {
        const subscriptions = snapshot.docs.map(doc => parseUnserializables(doc.data()));
        dispatch(generatedActions.setSubscriptions(subscriptions));
      });
  }
);

const createSubscription = createAsyncThunk(
  'createSubscription',
  async ({ stripe, card }) => {
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

    // Save the payment method.
    const { uid } = app.auth().currentUser;
    const result = await app.firestore()
      .collection('stripe_customers')
      .doc(uid)
      .collection('payment_methods')
      .doc(paymentMethod.id)
      .set({ id: paymentMethod.id });

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
  'initBilling',
  async (_, { dispatch }) => {
    app.auth().onAuthStateChanged((authUser) => {
      unsubscribePayments();
      unsubscribePaymentMethods();
      unsubscribeSubscriptions();

      dispatch(generatedActions.reset());

      if (authUser) {
        app
          .firestore()
          .collection('stripe_customers')
          .doc(authUser.uid)
          .onSnapshot((snapshot) => {
            const customerData = snapshot.data();
            console.log('Billing:', customerData);
            if (customerData) {
              dispatch(generatedActions.setCustomerData(parseUnserializables(customerData)));
              dispatch(_startDataListeners());
            }
          })
      }
    });
  }
);

const setValue = name => (state, action) => {
  state[name] = action.payload;
};

const mergeValue = name => (state, action) => {
  state[name] = { ...state[name], ...action.payload };
};

const { reducer, actions: generatedActions } = createSlice({
  name: 'billing',
  initialState,
  reducers: {
    setCustomerData: setValue('customerData'),
    setPaymentMethods: setValue('paymentMethods'),
    setSubscriptions: setValue('subscriptions'),
    setPayments: setValue('payments'),
    setUI: mergeValue('ui'),
    resetUI: (state) => { state.ui = initialState.ui; },
    reset: reset(initialState)
  }
});

const actions = { ...generatedActions, init, createSubscription, cancelSubscription };

const select = ({ billing }) => billing;
/**
 * Returns the first active subscription.
 */
const selectSubscription = createSelector(select, ({ subscriptions }) => {
  if (!subscriptions.length) return null;
  const active = subscriptions.find(({ status }) => status === 'active');
  return active === undefined ? null : active;
});
const selectors = { select, selectSubscription };

export { selectors, actions };
export default reducer;
