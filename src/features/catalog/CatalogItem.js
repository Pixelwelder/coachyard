import React from 'react';

const CatalogItem = ({ item }) => {
  const { displayName } = item;

  return (
    <div className="catalog-item">
      <p>{displayName}</p>
    </div>
  );
};

export default CatalogItem;
