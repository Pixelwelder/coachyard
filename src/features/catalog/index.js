import React from 'react';
import { LearningCatalogList, BaseCatalogList } from './CatalogList';
import './catalog.scss';
import { actions as catalogActions, selectors as catalogSelectors, TABS } from './catalogSlice';
import { selectors as dashboardSelectors } from '../dashboard/dashboardSlice';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import { useDispatch, useSelector } from 'react-redux';
// import Button from '@material-ui/core/Button';
// import { actions as uiActions2 } from '../ui/uiSlice2';
// import { selectors as billingSelectors2 } from '../billing2/billingSlice2';
// import { useHistory } from 'react-router-dom';

// const requireBilling = false;
const Catalog = () => {
  const dispatch = useDispatch();
  const { tab } = useSelector(catalogSelectors.select);
  const products = useSelector(dashboardSelectors.selectTemplateTokens);
  const courses = useSelector(dashboardSelectors.selectNonTemplateTokens);
  // const isTeacher = useSelector(catalogSelectors.selectIsTeacher);
  // const { tier } = useSelector(billingSelectors2.select);
  // const history = useHistory();

  // const onCreate = () => {
  //   if (requireBilling && !tier) {
  //     history.push('/billing');
  //   } else {
  //     dispatch(uiActions2.createCourse.open());
  //   }
  // };

  return (
    <div className="catalog">
      <Tabs
        value={tab}
        onChange={(event, newValue) => dispatch(catalogActions.setTab(newValue))}
      >
        <Tab label="Learning" />
        <Tab label="Teaching" />
      </Tabs>
      {/*<div className="catalog-controls">*/}
      {/*  <Button variant="contained" color="primary" onClick={onCreate}>Create New</Button>*/}
      {/*</div>*/}
      <div className="catalog-content">
        {tab === TABS.TEACHING && (
          <>
            <BaseCatalogList title="Active Channels" items={courses} showCreate />
            <BaseCatalogList title="Templates" items={products} showCreate />
          </>
        )}
        {tab === TABS.LEARNING && (<LearningCatalogList />)}
      </div>
    </div>
  );
};

export default Catalog;
