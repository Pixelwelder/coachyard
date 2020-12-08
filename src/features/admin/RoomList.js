import React, { useState } from 'react';
import Button from '@material-ui/core/Button';
import { useDispatch, useSelector } from 'react-redux';
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
import DeleteDialog from './DeleteDialog';
import InfoIcon from '@material-ui/icons/Info';

const CreateDialog = ({ open, onClose, onConfirm }) => {
  const [name, setName] = useState('');

  const close = () => {
    setName('');
    onClose();
  }

  return (
    <Dialog open={open} onClose={close} aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">Create Live Session</DialogTitle>
      <DialogContent>
        <DialogContentText>
          What would you like to call this live session?
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          id="name"
          label="name"
          type="text"
          fullWidth
          value={name}
          onChange={({ target: { value } }) => setName(value)}
        />
      </DialogContent>
      <DialogActions>
        {/*<Button onClick={() => setShowNewDialog(false)} color="primary">*/}
        {/*  Cancel*/}
        {/*</Button>*/}
        <Button
          onClick={() => onConfirm({ name: name })}
          color="primary"
        >
          Create!
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const RoomList = () => {
  const dispatch = useDispatch();
  const items = useSelector(adminSelectors.selectRooms);
  const [showNewDialog, setShowNewDialog] = useState(false);

  const [newName, setNewName] = useState('');
  // const [toDelete, setToDelete] = useState('');

  const fetchItems = adminActions.fetchRooms;

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
            <Button onClick={() => {
              dispatch(adminActions.setToExamine(params.data));
            }}>
              <InfoIcon />
            </Button>
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
              onClick={() => {
                dispatch(adminActions.setToDelete(params.getValue('name')))
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
      <Button onClick={() => dispatch(fetchItems())}>
        <CachedIcon />
      </Button>
      <Button onClick={() => {
        setShowNewDialog(true);
        setNewName('');
      }}>
        <AddIcon />
      </Button>

      <DataGrid
        rows={items}
        columns={columns}
      />

      <CreateDialog
        open={showNewDialog}
        onClose={() => setShowNewDialog(false)}
        onConfirm={({ name }) => {
          setShowNewDialog(false);
          dispatch(adminActions.createRoom({ name }));
        }}
      />

      {/*<DeleteDialog*/}
      {/*  toDelete={toDelete}*/}
      {/*  onClose={() => setToDelete('')}*/}
      {/*  onConfirm={() => {*/}
      {/*    dispatch(adminActions.deleteRoom({ name: toDelete }));*/}
      {/*    setToDelete('');*/}
      {/*  }}*/}
      {/*/>*/}

    </div>
  );
};

export default RoomList;
