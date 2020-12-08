import React from 'react';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';

import { actions as navActions, MAIN_TABS, selectors as navSelectors } from './navSlice';
import { useDispatch, useSelector } from 'react-redux';

const Nav = () => {
  const dispatch = useDispatch();
  const { mainTab } = useSelector(navSelectors.select);

  return (
    <Tabs value={mainTab} onChange={(event, newValue) => dispatch(navActions.setMainTab(newValue))}>
      <Tab label="Video" value={MAIN_TABS.VIDEO} />
      <Tab label="Course" value={MAIN_TABS.COURSE} />
      <Tab label="Admin" value={MAIN_TABS.ADMIN} />
      <Tab label="Dev" value={MAIN_TABS.DEV} />
    </Tabs>
  );
};

export default Nav;
