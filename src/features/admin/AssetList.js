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
              onClick={() => {
                const name = params.getValue('name');
                setToDelete(name);
              }}
            >
              <DeleteIcon />
            </Button>
          </div>
        )
      }
    }
  ];

  return (
    <div style={{ height: 400, width: '100%' }}>
      <Button onClick={() => dispatch(adminActions.fetchAssets())}>
        <CachedIcon />
      </Button>

      <DataGrid
        rows={items}
        columns={columns}
      />

      <DeleteDialog
        toDelete={toDelete}
        onClose={() => setToDelete('')}
        onConfirm={() => {
          dispatch(adminActions.deleteRoom({ name: toDelete }));
          setToDelete('');
        }}
      />

      <Dialog open={!!toDelete} onClose={() => setToDelete('')} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Delete Live Session</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete Live Session '{toDelete}'?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToDelete('')} color="primary">
            Cancel
          </Button>
          <Button
            onClick={() => {
              dispatch(adminActions.deleteRoom({ name: toDelete }));
              setToDelete('');
            }}
            color="primary"
          >
            Delete!
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AssetList;
