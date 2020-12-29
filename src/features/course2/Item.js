import React from 'react';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import Button from '@material-ui/core/Button';

const ItemList = ({ item, onEdit, onDelete }) => {
  return (
    <li className="item">
      <span className="item-title">{item.displayName}</span>
      <EditIcon />
      <DeleteIcon />
    </li>
  )
};

export default ItemList;
