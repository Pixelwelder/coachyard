import React from 'react';
import { LearningCatalogList, BaseCatalogList } from './CatalogList';
import './catalog.scss';
import { actions as catalogActions, selectors as catalogSelectors, TABS } from './catalogSlice';
import { selectors as dashboardSelectors } from '../dashboard/dashboardSlice';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import { useDispatch, useSelector } from 'react-redux';

const Catalog = () => {
  const dispatch = useDispatch();
  const { tab } = useSelector(catalogSelectors.select);
  const products = useSelector(dashboardSelectors.selectTemplateTokens);
  const courses = useSelector(dashboardSelectors.selectNonTemplateTokens);
  const isTeacher = useSelector(catalogSelectors.selectIsTeacher);

  return (
    <div className="catalog">
      <Tabs
        value={tab}
        onChange={(event, newValue) => dispatch(catalogActions.setTab(newValue))}
      >
        <Tab label="Learning" />
        <Tab label="Teaching" />
      </Tabs>
      <div className="catalog-content">
        {tab === TABS.TEACHING && (
          <>
            <BaseCatalogList title="Products" items={products} showCreate={true} />
            <BaseCatalogList title="Teaching" items={courses} />
          </>
        )}
        {tab === TABS.LEARNING && (<LearningCatalogList />)}
      </div>
    </div>
  );
};

export default Catalog;
