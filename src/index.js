import React from 'react';
import ReactDOM from 'react-dom';
// import App from './_App';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import LuxonUtils from '@date-io/luxon';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js/pure';
import * as serviceWorker from './serviceWorker';
import store from './app/store';
import App from './app';
// import history from './util/history';

const stripePromise = loadStripe('pk_test_51I1CdRISeRywORkaq77pnFumuqJSFrt3iS7MpQrklwFmMnGWTQvulNSdMCWDyNAva3DpXTyi6wMdYNe9cDMNHAA500upm6uPsE');

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <Router>
        <Elements stripe={stripePromise}>
          <MuiPickersUtilsProvider utils={LuxonUtils}>
            <App />
          </MuiPickersUtilsProvider>
        </Elements>
      </Router>
    </Provider>
  </React.StrictMode>,
  document.getElementById('root'),
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
