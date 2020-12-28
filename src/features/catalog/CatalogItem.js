import React from 'react';
import { Link } from 'react-router-dom';

const CatalogItem = ({ item }) => {
  const { displayName, uid } = item;

  return (
    <div
      className="catalog-item"
      onClick={() => {}}
    >
      <Link to={`/course/${uid}`}>{displayName}</Link>
    </div>
  );
};

export default CatalogItem;
