import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';

import RoomList from './RoomList';
import RecordingList from './RecordingList';
import AssetList from './AssetList';
import { actions as navActions, ADMIN_TABS, selectors as navSelectors } from '../nav/navSlice';
import { actions as adminActions, selectors as adminSelectors } from './adminSlice';
import { selectors as appSelectors } from '../app/appSlice';
import USER_PRIVILEGES from '../../constants/userPrivileges';

import './style.scss';
import Info from './Info';
import DeleteDialog from './DeleteDialog';

const Admin = () => {
  const dispatch = useDispatch();
  const { adminTab } = useSelector(navSelectors.select);
  const { toDelete, toExamine } = useSelector(adminSelectors.selectUI);
  const { authUser } = useSelector(appSelectors.select);

  const { claims: { privileges } = 0 } = authUser;
  const isAdmin = (privileges & USER_PRIVILEGES.IS_ADMIN) === USER_PRIVILEGES.IS_ADMIN;

  return (
    <div className="admin">
      <Tabs value={adminTab} onChange={(event, newValue) => dispatch(navActions.setAdminTab(newValue))}>
        <Tab label="Rooms" />
        {isAdmin && <Tab label="Recordings"/>}
        {isAdmin && <Tab label="Assets"/>}
      </Tabs>

      {adminTab === ADMIN_TABS.ROOMS && <RoomList />}
      {adminTab === ADMIN_TABS.RECORDINGS && <RecordingList />}
      {adminTab === ADMIN_TABS.ASSETS && <AssetList />}

      {!!toExamine && (
        <Info item={toExamine} onClose={() => dispatch(adminActions.setToExamine(null))} />
      )}

      {!!toDelete && (
        <DeleteDialog
          toDelete={toDelete}
          onClose={() => dispatch(adminActions.setToDelete(''))}
          onConfirm={() => {
            dispatch(adminActions.deleteRoom({ name: toDelete }));
            dispatch(adminActions.setToDelete(null));
          }}
        />
      )}
    </div>
  )
};

export default Admin;
