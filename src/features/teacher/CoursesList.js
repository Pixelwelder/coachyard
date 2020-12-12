import React, { useState } from 'react';
import Button from '@material-ui/core/Button';
import { actions as adminActions } from '../admin/adminSlice';
import InfoIcon from '@material-ui/icons/Info';
import { actions as videoActions } from '../videoIframe/videoSlice';
import { actions as navActions, MAIN_TABS } from '../nav/navSlice';
import JoinIcon from '@material-ui/icons/LiveTv';
import DeleteIcon from '@material-ui/icons/Delete';
import { DataGrid } from '@material-ui/data-grid';
import CachedIcon from '@material-ui/icons/Cached';
import AddIcon from '@material-ui/icons/Add';

import NewCourseDialog from './NewCourseDialog';

const CoursesList = () => {
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
            {/*<Button onClick={() => {*/}
            {/*  console.log('PARAMS', params.data);*/}
            {/*  dispatch(adminActions.setToExamine(params.data));*/}
            {/*}}>*/}
            {/*  <InfoIcon />*/}
            {/*</Button>*/}
            {/*<Button*/}
            {/*  onClick={() => {*/}
            {/*    const url = params.getValue('url');*/}
            {/*    dispatch(videoActions.setUrl(url));*/}
            {/*    dispatch(navActions.setMainTab(MAIN_TABS.VIDEO));*/}
            {/*  }}*/}
            {/*>*/}
            {/*  <JoinIcon />*/}
            {/*</Button>*/}
            {/*<Button*/}
            {/*  disabled={true}*/}
            {/*  onClick={() => setToDelete(params.getValue('name'))}*/}
            {/*>*/}
            {/*  <DeleteIcon />*/}
            {/*</Button>*/}
          </div>
        )
      }
    }
  ];

  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div>
      <Button onClick={() => {}}>
        <CachedIcon />
      </Button>
      <Button onClick={() => setShowCreateDialog(true)}>
        <AddIcon />
      </Button>

      <div style={{ height: 400 }}>
        <DataGrid
          rows={[]}
          columns={columns}
        />
      </div>

      <NewCourseDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />
    </div>
  );
};

export default CoursesList;
