import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';

import RoomList from './RoomList';
import RecordingList from './RecordingList';
import { actions as navActions, ADMIN_TABS, selectors as navSelectors } from '../nav/navSlice';

const Admin = () => {
  const dispatch = useDispatch();
  const { adminTab } = useSelector(navSelectors.select);

  return (
    <div className="admin">
      <Tabs value={adminTab} onChange={(event, newValue) => dispatch(navActions.setAdminTab(newValue))}>
        <Tab label="Rooms" />
        <Tab label="Recordings" />
      </Tabs>

      {adminTab === ADMIN_TABS.ROOMS && <RoomList />}
      {adminTab === ADMIN_TABS.RECORDINGS && <RecordingList />}
    </div>
  )
};

export default Admin;
