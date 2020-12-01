import React, { useState } from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import { DataGrid } from '@material-ui/data-grid';
import CachedIcon from '@material-ui/icons/Cached';
import AddIcon from '@material-ui/icons/Add';
import JoinIcon from '@material-ui/icons/LiveTv';
import DeleteIcon from '@material-ui/icons/Delete'

import { useDispatch, useSelector } from 'react-redux';

import { selectors as adminSelectors, actions as adminActions } from './adminSlice';
import { actions as videoActions } from '../videoIframe/videoSlice';
import { actions as navActions, TABS } from '../nav/navSlice';

const Admin = () => {
  const dispatch = useDispatch();
  const rooms = useSelector(adminSelectors.selectRooms);
  const [showNewDialog, setShowNewDialog] = useState(false);

  const [newName, setNewName] = useState('');
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
                dispatch(navActions.setTab(TABS.VIDEO));
              }}
            >
              <JoinIcon />
            </Button>
            <Button
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
      <Button onClick={() => dispatch(adminActions.fetchRooms())}><CachedIcon /></Button>
      <Button onClick={() => {
        setShowNewDialog(true);
        setNewName('');
      }}>
        <AddIcon />
      </Button>
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

      <Dialog open={showNewDialog} onClose={() => setShowNewDialog(false)} aria-labelledby="form-dialog-title">
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
            value={newName}
            onChange={({ target: { value } }) => setNewName(value)}
          />
        </DialogContent>
        <DialogActions>
          {/*<Button onClick={() => setShowNewDialog(false)} color="primary">*/}
          {/*  Cancel*/}
          {/*</Button>*/}
          <Button
            onClick={() => {
              setShowNewDialog(false);
              dispatch(adminActions.createRoom({ name: newName }));
            }}
            color="primary"
          >
            Create!
          </Button>
        </DialogActions>
      </Dialog>

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
  )
};

export default Admin;
