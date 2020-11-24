import React from "react";

export const LogItem = ({ log }) => {
  const { message, type, timestamp } = log;

  return (
    <li className="log-item">
      <div className={`log-type log-type-${type}`}/>
      <div className="log-timestamp">{timestamp}</div>
      <div className={`log-message log-message-${type}`}>{message}</div>
    </li>
  );
};