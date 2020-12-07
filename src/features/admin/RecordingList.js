import React, { useState } from 'react';
import Button from '@material-ui/core/Button';
import { actions as videoActions } from '../videoIframe/videoSlice';
import { actions as navActions, MAIN_TABS } from '../nav/navSlice';
import JoinIcon from '@material-ui/icons/LiveTv';
import DeleteIcon from '@material-ui/icons/Delete';
import { actions as adminActions, selectors as adminSelectors } from './adminSlice';
import CachedIcon from '@material-ui/icons/Cached';
import ReactPlayer from 'react-player';
import DownloadIcon from '@material-ui/icons/GetApp';
import InfoIcon from '@material-ui/icons/Info';
import { DataGrid } from '@material-ui/data-grid';
import CompositeIcon from '@material-ui/icons/SystemUpdateAlt';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText/DialogContentText';
import TextField from '@material-ui/core/TextField';
import DialogActions from '@material-ui/core/DialogActions';
import { useDispatch, useSelector } from 'react-redux';
import Info from './Info';

const RecordingList = () => {
  const dispatch = useDispatch();
  const items = useSelector(adminSelectors.selectRecordings);
  const [item, setItem] = useState(false);

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
                dispatch(navActions.setMainTab(MAIN_TABS.VIDEO));
              }}
            >
              <JoinIcon />
            </Button>
            <Button onClick={() => setToDelete(params.getValue('name'))}>
              <DeleteIcon />
            </Button>
            {/*<Button onClick={() => {}}>*/}
            {/*  <DownloadIcon />*/}
            {/*</Button>*/}
            <Button onClick={() => setItem(params.data)}>
              <InfoIcon />
            </Button>
            <Button onClick={() => dispatch(adminActions.createComposite({ id: params.data.id }))}>
              <CompositeIcon />
            </Button>
          </div>
        )
      }
    }
  ];

  return (
    <div style={{ height: 400, width: '100%' }}>
      <Button onClick={() => dispatch(adminActions.fetchRecordings())}><CachedIcon /></Button>

      <DataGrid
        rows={items}
        columns={columns}
      />



      <Info item={item} onClose={() => setItem(null)} />

      {/*<Dialog open={!!toDelete} onClose={() => setToDelete('')} aria-labelledby="form-dialog-title">*/}
      {/*  <DialogTitle id="form-dialog-title">Delete Live Session</DialogTitle>*/}
      {/*  <DialogContent>*/}
      {/*    <DialogContentText>*/}
      {/*      Are you sure you want to delete Live Session '{toDelete}'?*/}
      {/*    </DialogContentText>*/}
      {/*  </DialogContent>*/}
      {/*  <DialogActions>*/}
      {/*    <Button onClick={() => setToDelete('')} color="primary">*/}
      {/*      Cancel*/}
      {/*    </Button>*/}
      {/*    <Button*/}
      {/*      onClick={() => {*/}
      {/*        // dispatch(adminActions.deleteRoom({ name: toDelete }));*/}
      {/*        setToDelete('');*/}
      {/*      }}*/}
      {/*      color="primary"*/}
      {/*    >*/}
      {/*      Delete!*/}
      {/*    </Button>*/}
      {/*  </DialogActions>*/}
      {/*</Dialog>*/}
    </div>
  );
};

export default RecordingList;
