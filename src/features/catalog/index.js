import React from 'react';
import { TeachingCatalogList, LearningCatalogList } from './CatalogList';
import './catalog.scss';

const Catalog = () => {
  return (
    <div className="catalog">
      <LearningCatalogList />
      <TeachingCatalogList />
    </div>
  );
};

export default Catalog;
