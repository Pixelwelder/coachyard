import React from 'react';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import { useDispatch, useSelector } from 'react-redux';

import { actions as navActions, MAIN_TABS, selectors as navSelectors } from './navSlice';
import { selectors as appSelectors } from '../app/appSlice';
import USER_PRIVILEGES from '../../constants/userPrivileges';


const Nav = () => {
  const dispatch = useDispatch();
  const { mainTab } = useSelector(navSelectors.select);
  const { authUser } = useSelector(appSelectors.select);
  const { claims: { privileges = 0 } = {} } = authUser;
  const isAdmin = (privileges & USER_PRIVILEGES.IS_ADMIN) === USER_PRIVILEGES.IS_ADMIN;

  return (
    <Tabs value={mainTab} onChange={(event, newValue) => dispatch(navActions.setMainTab(newValue))}>
      <Tab label="Live Session" value={MAIN_TABS.VIDEO} />
      <Tab label="Course" value={MAIN_TABS.COURSE} />
      {isAdmin && <Tab label="Admin" value={MAIN_TABS.ADMIN}/>}
      {isAdmin && <Tab label="Dev" value={MAIN_TABS.DEV}/>}
    </Tabs>
  );
};

export default Nav;
