import React from 'react';
import Button from '@material-ui/core/Button';
import CachedIcon from '@material-ui/icons/Cached';
import AddIcon from '@material-ui/icons/Add';

const Students = () => {
  return (
    <div>
      <div>
        <Button onClick={() => {}} disabled>
          <CachedIcon />
        </Button>
        <Button onClick={() => {}}>
          <AddIcon />
        </Button>
      </div>
    </div>
  );
};

export default Students;
