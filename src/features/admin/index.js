import React from 'react';
import Button from '@material-ui/core/Button';
import { DataGrid } from '@material-ui/data-grid';
import CachedIcon from '@material-ui/icons/Cached';
import AddIcon from '@material-ui/icons/Add';

import { useDispatch, useSelector } from 'react-redux';

import { selectors as adminSelectors, actions as adminActions } from './adminSlice';

const Admin = () => {
  const dispatch = useDispatch();
  const rooms = useSelector(adminSelectors.selectRooms);
  console.log('rooms', rooms);
  const columns = [
    { field: 'name', headerName: 'Name', width: 220 },
    { field: 'id', headerName: 'ID', width: 220 }
  ];

  return (
    <div style={{ height: 400, width: '100%' }}>
      <h2>Admin</h2>
      <Button onClick={() => dispatch(adminActions.fetchRooms())}><CachedIcon /></Button>
      <Button><AddIcon /></Button>
      <DataGrid
        rows={rooms}
        columns={columns}
        // rowHeight={}
        // headerHeight={}
        // scrollbarSize={}
        // columnBuffer={}
        // sortingOrder={}
        // icons={}
        // columnTypes={}
      />
    </div>
  )
};

export default Admin;
