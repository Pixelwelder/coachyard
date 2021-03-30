import Typography from '@material-ui/core/Typography';
import ParticipantList from '../../components/ParticipantList';
import React from 'react';

const ItemInfo = ({ item, tokens, status }) => {
  return (
    <div className="item-info">
      <Typography variant="h5">{item.displayName}</Typography>
      <ParticipantList tokens={tokens}/>
      <Typography className="meeting-date">{status}</Typography>
    </div>
  );
};

export default ItemInfo;
