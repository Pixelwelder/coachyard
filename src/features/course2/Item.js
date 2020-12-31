import React from 'react';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import Button from '@material-ui/core/Button';
import { DateTime } from 'luxon';

const ItemList = ({ item, isSelected, onSelect, onEdit, onDelete }) => {
  return (
    <li className={`item${isSelected ? ' selected-item' : ''}`}>
      <span
        onClick={onSelect} className="item-title"
      >
        <p>{item.displayName}</p>
        <p>{DateTime.fromISO(item.date).toLocal().toLocaleString(DateTime.DATETIME_SHORT)}</p>
        <p>{item.status}</p>
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
