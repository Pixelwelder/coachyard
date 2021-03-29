import React from 'react';
import { TeachingCatalogList, LearningCatalogList, TemplateCatalogList, PublicCatalogList } from './CatalogList';
import './catalog.scss';
import { actions as catalogActions, selectors as catalogSelectors, TABS } from './catalogSlice';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import { useDispatch, useSelector } from 'react-redux';

const Catalog = () => {
  const dispatch = useDispatch();
  const { tab } = useSelector(catalogSelectors.select);

  return (
    <div className="catalog">
      <Tabs
        value={tab}
        onChange={(event, newValue) => dispatch(catalogActions.setTab(newValue))}
      >
        <Tab label="Teaching" />
        <Tab label="Learning" />
      </Tabs>
      <div className="catalog-content">
        {tab === TABS.TEACHING && (
          <>
            <TeachingCatalogList />
            <PublicCatalogList />
          </>
        )}
        {tab === TABS.LEARNING && (<LearningCatalogList />)}
      </div>
    </div>
  );
};

export default Catalog;
