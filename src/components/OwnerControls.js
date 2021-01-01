import React from 'react';
import Button from '@material-ui/core/Button';

const OwnerControls = ({ onDelete, onCancelEdit, onSubmit }) => {
  return (
    <div className="owner-controls">
      <Button
        variant="contained" color="secondary"
        onClick={onDelete}
      >
        Delete
      </Button>
      <div className="spacer" />
      <Button
        variant="outlined"
        onClick={onCancelEdit}
      >
        Cancel
      </Button>
      <Button
        type="submit" variant="contained" color="primary"
        onClick={onSubmit}
      >
        Save
      </Button>
    </div>
  );
};

export default OwnerControls;
