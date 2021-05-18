import Typography from '@material-ui/core/Typography';
import React from 'react';
import ParticipantList from '../../components/ParticipantList';

const ItemInfo = ({ item, tokens, status }) => (
  <div className="item-info">
    <Typography variant="h5">{item.displayName}</Typography>
    <ParticipantList tokens={tokens} />
    <Typography className="meeting-date">{status}</Typography>
  </div>
);

export default ItemInfo;
