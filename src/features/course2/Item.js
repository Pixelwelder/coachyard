import React from 'react';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import { DateTime } from 'luxon';
import Typography from '@material-ui/core/Typography';

const ItemList = ({ item, isSelected, onSelect, onEdit, onDelete }) => {

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
        {item.status !== 'live' && (
          <Typography>{formattedTime} (in {timeRemaining})</Typography>
        )}
        {item.status === 'live' && (
          <Typography>Now live</Typography>
        )}
      </span>
      {isSelected && (
        <>
          <EditIcon onClick={onEdit} />
          <DeleteIcon onClick={onDelete} />
        </>
      )}
    </li>
  )
};

export default ItemList;
