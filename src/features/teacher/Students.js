import React, { useState } from 'react';
import Button from '@material-ui/core/Button';
import CachedIcon from '@material-ui/icons/Cached';
import AddIcon from '@material-ui/icons/Add';
import NewStudentDialog from './NewStudentDialog';

const Students = () => {
  const [showNewDialog, setShowNewDialog] = useState(false);

  const onClose = () => {
    setShowNewDialog(false);
  }

  return (
    <div>
      <div>
        <Button onClick={() => {}} disabled>
          <CachedIcon />
        </Button>
        <Button onClick={() => setShowNewDialog(true)}>
          <AddIcon />
        </Button>
      </div>

      <NewStudentDialog open={showNewDialog} onClose={() => setShowNewDialog(false)} />
    </div>
  );
};

export default Students;
