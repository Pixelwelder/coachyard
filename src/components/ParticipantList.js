import React from 'react';
import StorageImage from './StorageImage';
import { Typography } from '@material-ui/core';

const ParticipantList = ({ tokens }) => {
  return (
    <ul className="participant-images">
      {
        tokens.map((token, index) => (
          <li className="token-item" key={index}>
            <StorageImage url={`/avatars/${token.user}.png`} className="item-info-image" />
            <Typography>{token.userDisplayName}</Typography>
          </li>
        ))
      }
    </ul>
  );
};

export default ParticipantList;
