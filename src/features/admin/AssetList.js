import React, { useState } from 'react';
import Button from '@material-ui/core/Button';
import { actions as videoActions } from '../videoIframe/videoSlice';
import { actions as navActions, MAIN_TABS } from '../nav/navSlice';
import JoinIcon from '@material-ui/icons/LiveTv';
import DeleteIcon from '@material-ui/icons/Delete';
import { actions as adminActions, selectors as adminSelectors } from './adminSlice';
import CachedIcon from '@material-ui/icons/Cached';
import AddIcon from '@material-ui/icons/Add';
import MergeTypeIcon from '@material-ui/icons/MergeType';
import { DataGrid } from '@material-ui/data-grid';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText/DialogContentText';
import TextField from '@material-ui/core/TextField';
import DialogActions from '@material-ui/core/DialogActions';
import { useDispatch, useSelector } from 'react-redux';
import DeleteDialog from './DeleteDialog';
import ReactPlayer from 'react-player';

const AssetList = () => {
  const dispatch = useDispatch();
  const items = useSelector(adminSelectors.selectAssets);
  const [toDelete, setToDelete] = useState('');

  const columns = [
    { field: 'name', headerName: 'Name', width: 220 },
    { field: 'id', headerName: 'ID', width: 220 },
    {
      field: '',
      headerName: 'Actions',
      width: 300,
      disableClickEventBubbling: true,
      renderCell: (params) => {
        return (
          <div>
            <Button
              onClick={() => {
                const url = params.getValue('url');
                dispatch(videoActions.setUrl(url));
                dispatch(navActions.setMainTab(MAIN_TABS.VIDEO));
              }}
            >
              <JoinIcon />
            </Button>
            <Button
              disabled={true}
              onClick={() => setToDelete(params.getValue('name'))}
            >
              <DeleteIcon />
            </Button>
          </div>
        )
      }
    }
  ];

  return (
    <div style={{ height: 400, width: '100%', border: '1px solid red' }}>
      <Button onClick={() => dispatch(adminActions.fetchAssets())}>
        <CachedIcon />
      </Button>

      <div style={{ display: 'flex' }}>
        <DataGrid
          rows={items}
          columns={columns}
        />

        <ReactPlayer
          width={400}
          height={300}
          style={{ border: '3px solid blue' }}
          url={`https://api.daily.co/v1/recordings/0526c677-f214-41ba-8ead-53ed1ec3f8ae/composites/17c60468-79d4-4e3a-ff87-9ef161e2f60a.mp4`}
        />
      </div>

      <DeleteDialog
        toDelete={toDelete}
        onClose={() => setToDelete('')}
        onConfirm={() => {
          dispatch(adminActions.deleteAsset({ name: toDelete }));
          setToDelete('');
        }}
      />
    </div>
  );
};

export default AssetList;
