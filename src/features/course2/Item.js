import React from 'react';
import { DateTime } from 'luxon';
import Typography from '@material-ui/core/Typography';

const Item = ({ item, isSelected, onSelect }) => {

  const formattedTime = DateTime.fromISO(item.date).toLocal().toLocaleString(DateTime.DATETIME_SHORT);
  const timeRemaining = DateTime.fromISO(item.date).toLocal().diff(DateTime.local()).toFormat('h:mm');

  return (
    <li className={`item item${isSelected ? ' selected-item' : ''} item-${item.status}`}>
      <span
        onClick={onSelect} className="item-title"
      >
        <Typography className="item-name">
          {item.displayName}
        </Typography>
        {item.status === 'scheduled' && (
          <Typography>{formattedTime} (in {timeRemaining})</Typography>
        )}
        {item.status === 'live' && (
          <Typography>Now live</Typography>
        )}
        {item.status === 'processing' && (
          <Typography>Processing</Typography>
        )}
        {/* TODO Time would be super cool. */}
        {item.status === 'viewing' && (
          <Typography>{'-'}</Typography>
        )}
      </span>
    </li>
  )
};

export default Item;
