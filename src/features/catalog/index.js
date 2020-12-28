import React from 'react';
import './catalog.scss';
import { TeachingCatalogList, LearningCatalogList } from './CatalogList';

const Catalog = () => {
  return (
    <div className="catalog">
      <TeachingCatalogList />
      <LearningCatalogList />
    </div>
  );
};

export default Catalog;
