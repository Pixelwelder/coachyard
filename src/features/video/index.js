import React from 'react';
import './index.css';
import App from './components/App/App';
import BrowserUnsupported from './components/BrowserUnsupported/BrowserUnsupported';
import DailyIframe from '@daily-co/daily-js';

const Main = () => {
  return DailyIframe.supportedBrowser().supported
    ? <App />
    : <BrowserUnsupported />;
};

export default Main;
