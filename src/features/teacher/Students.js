import React, { useState } from 'react';
import Button from '@material-ui/core/Button';
import CachedIcon from '@material-ui/icons/Cached';
import AddIcon from '@material-ui/icons/Add';
import { DataGrid } from '@material-ui/data-grid';
import { useDispatch, useSelector } from 'react-redux';

import { selectors as appSelectors, actions as appActions } from '../app/appSlice';
import NewStudentDialog from './NewStudentDialog';

const Students = () => {
  const [showNewDialog, setShowNewDialog] = useState(false);
  const students = useSelector(appSelectors.selectStudents);
  const dispatch = useDispatch();

  const columns = [
    { field: 'displayName', headerName: 'Name', width: 220 },
    { field: 'email', headerName: 'Email', width: 220 },
    { field: 'uid', headerName: 'Is Member?', width: 220, valueFormatter: ({ value }) => !!value },
  ];

  return (
    <div>
      <div>
        <Button onClick={() => {}}>
          <CachedIcon />
        </Button>
        {/*<Button onClick={() => setShowNewDialog(true)}>*/}
        {/*  <AddIcon />*/}
        {/*</Button>*/}
      </div>
      <div style={{ height: 300 }}>
        <DataGrid
          rows={students}
          columns={columns}
        />
      </div>

      <NewStudentDialog open={showNewDialog} onClose={() => setShowNewDialog(false)} />
    </div>
  );
};

export default Students;
