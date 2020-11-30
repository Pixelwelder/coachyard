import React from 'react';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';

import { actions as navActions, selectors as navSelectors } from './navSlice';
import { useDispatch, useSelector } from 'react-redux';

const Nav = () => {
  const dispatch = useDispatch();
  const { tab } = useSelector(navSelectors.select);

  return (
    <Tabs value={tab} onChange={(event, newValue) => dispatch(navActions.setTab(newValue))}>
      <Tab label="Video" />
      <Tab label="Admin" />
      <Tab label="Dev" />
    </Tabs>
  );
};

export default Nav;
