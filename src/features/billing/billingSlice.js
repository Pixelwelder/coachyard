import app from 'firebase/app';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { parseUnserializables } from '../../util/firestoreUtils';

const initialState = {
  customerData: null,
  paymentMethods: [],
  payments: []
};

/**
 * Listen to payment methods and payments.
 */
let unsubscribePayments = () => {};
let unsubscribePaymentMethods = () => {};
const _startDataListeners = createAsyncThunk(
  'startDataListeners',
  async (_, { dispatch }) => {
    console.log('billing: start data listeners');
    unsubscribePaymentMethods = app
      .firestore()
      .collection('stripe_customers')
      .doc(app.auth().currentUser.uid)
      .collection('payment_methods')
      .onSnapshot((snapshot) => {
        console.log('billing: payment methods updated');
        const paymentMethods = snapshot.docs.map(doc => parseUnserializables(doc.data()));
        dispatch(generatedActions.setPaymentMethods(paymentMethods));
      });

    unsubscribePayments = app
      .firestore()
      .collection('stripe_customers')
      .doc(app.auth().currentUser.uid)
      .collection('payments')
      .onSnapshot((snapshot) => {
        console.log('billing: payments updated');
        const payments = snapshot.docs.map(doc => parseUnserializables(doc.data()));
        dispatch(generatedActions.setPayments(payments));
      });
  }
);

const init = createAsyncThunk(
  'initBilling',
  async (_, { dispatch }) => {
    console.log('billing: init');
    app.auth().onAuthStateChanged((authUser) => {
      unsubscribePayments();
      unsubscribePaymentMethods();

      console.log('billing: auth changed');
      if (authUser) {
        app
          .firestore()
          .collection('stripe_customers')
          .doc(authUser.uid)
          .onSnapshot((snapshot) => {
            const customerData = snapshot.data();
            if (customerData) {
              dispatch(generatedActions.setCustomerData(parseUnserializables(customerData)));
              dispatch(_startDataListeners());
            } else {
              console.error(`No stripe customer for user ${authUser.uid}.`);
            }
          })
      }
    });
  }
);

const setValue = name => (state, action) => {
  state[name] = action.payload;
};

const { reducer, actions: generatedActions } = createSlice({
  name: 'billing',
  initialState,
  reducers: {
    setCustomerData: setValue('customerData'),
    setPaymentMethods: setValue('paymentMethods'),
    setPayments: setValue('payments')
  }
});

const actions = { ...generatedActions, init };

const select = ({ billing }) => billing;
const selectors = { select };

export { selectors, actions };
export default reducer;
