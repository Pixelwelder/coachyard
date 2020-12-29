import React from 'react';
import { Link } from 'react-router-dom';
import DeleteIcon from '@material-ui/icons/Delete';
import Button from '@material-ui/core/Button';

const CatalogItem = ({ item, onDelete }) => {
  const { displayName, uid } = item;

  return (
    <div
      className="catalog-item"
      onClick={() => {}}
    >
      <Link to={`/course/${uid}`}>{displayName}</Link>
      {onDelete && (
        <Button onClick={() => onDelete(item)}>
          <DeleteIcon />
        </Button>
      )}
    </div>
  );
};

export default CatalogItem;
