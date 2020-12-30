import React from 'react';
import './catalog.scss';
import { TeachingCatalogList, LearningCatalogList } from './CatalogList';
import { Link } from 'react-router-dom';

const Catalog = () => {
  return (
    <div className="catalog">
      <Link to="/courses">Courses</Link>
      <LearningCatalogList />
      <TeachingCatalogList />
    </div>
  );
};

export default Catalog;
