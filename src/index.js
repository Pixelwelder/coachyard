import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import store from './app/store';
import { Provider } from 'react-redux';
import * as serviceWorker from './serviceWorker';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import LuxonUtils from '@date-io/luxon';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js/pure';

const stripePromise = loadStripe('pk_test_51I1CdRISeRywORkaq77pnFumuqJSFrt3iS7MpQrklwFmMnGWTQvulNSdMCWDyNAva3DpXTyi6wMdYNe9cDMNHAA500upm6uPsE');

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <Elements stripe={stripePromise}>
        <MuiPickersUtilsProvider utils={LuxonUtils}>
          <App />
        </MuiPickersUtilsProvider>
      </Elements>
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
