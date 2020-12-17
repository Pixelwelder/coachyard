import React from 'react';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import { useDispatch, useSelector } from 'react-redux';

import { actions as navActions, MAIN_TABS, selectors as navSelectors } from './navSlice';

const Nav = () => {
  const dispatch = useDispatch();
  const { mainTab } = useSelector(navSelectors.select);

  return (
    <Tabs value={mainTab} onChange={(event, newValue) => dispatch(navActions.setMainTab(newValue))}>
      <Tab label="Live Session" value={MAIN_TABS.VIDEO} />
      <Tab label="Course" value={MAIN_TABS.COURSE} />
      <Tab label="Invites" value={MAIN_TABS.TEACHER} />
      {/* TODO: Admin limitations */}
      <Tab label="Admin" value={MAIN_TABS.ADMIN}/>
      <Tab label="Dev" value={MAIN_TABS.DEV}/>
    </Tabs>
  );
};

export default Nav;
