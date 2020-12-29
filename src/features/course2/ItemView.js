import React from 'react';

const ItemView = ({ item }) => {
  return (
    <div className="item-view">
      {!item && (
        <p>No item.</p>
      )}
      {item && (
        <p>{item.displayName}</p>
      )}
    </div>
  );
};

export default ItemView;
