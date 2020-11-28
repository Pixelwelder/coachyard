import React from 'react';

import './style.scss';

import { LogItem } from "./LogItem";
import { selectors as logSelectors } from './logSlice';
import { useSelector } from 'react-redux';

const Log = () => {
  const { messages } = useSelector(logSelectors.select);

  return (
    <div className="page log">
      <h2>Log</h2>
      <ul className="log-list">
        {messages.map((log, index) => <LogItem log={log} key={index} />)}
      </ul>
    </div>
  );
};

export default Log;
