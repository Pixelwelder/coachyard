import React from 'react';

const CatalogList = ({ title }) => {
  return (
    <div className="catalog-list">
      <p>{ title }</p>
      <p>Catalog List</p>
    </div>
  );
};

const TeachingCatalogList = () => {
  return <CatalogList title="Teaching" />;
};

const LearningCatalogList = () => {
  return <CatalogList title="Learning" />;
};

export { TeachingCatalogList, LearningCatalogList };
