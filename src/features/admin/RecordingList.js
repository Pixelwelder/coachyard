import React, { useState } from 'react';
import Button from '@material-ui/core/Button';
import { actions as videoActions } from '../videoIframe/videoSlice';
import { actions as navActions, MAIN_TABS } from '../nav/navSlice';
import JoinIcon from '@material-ui/icons/LiveTv';
import DeleteIcon from '@material-ui/icons/Delete';
import { actions as adminActions, selectors as adminSelectors } from './adminSlice';
import CachedIcon from '@material-ui/icons/Cached';
import InfoIcon from '@material-ui/icons/Info';
import { DataGrid } from '@material-ui/data-grid';
import CompositeIcon from '@material-ui/icons/SystemUpdateAlt';
import { useDispatch, useSelector } from 'react-redux';

const RecordingList = () => {
  const dispatch = useDispatch();
  const items = useSelector(adminSelectors.selectRecordings);
  const [item, setItem] = useState(false);

  const [newName, setNewName] = useState('');
  const [toDelete, setToDelete] = useState('');

  const columns = [
    { field: 'id', headerName: 'ID', width: 300 },
    { field: 'tracks', headerName: 'Tracks', valueFormatter: ({ value }) => value.length },
    {
      field: '',
      headerName: 'Actions',
      flex: 1,
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
            <Button onClick={() => {
              console.log('delete');
            }}>
              <DeleteIcon />
            </Button>
            {/*<Button onClick={() => {}}>*/}
            {/*  <DownloadIcon />*/}
            {/*</Button>*/}
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
