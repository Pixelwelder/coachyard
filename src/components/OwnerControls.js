import React from 'react';
import Button from '@material-ui/core/Button';

const OwnerControls = ({ onDelete, onCancel, onSubmit }) => {
  return (
    <div className="owner-controls">
      <Button
        variant="contained" color="secondary"
        onClick={onDelete}
        disabled={!onDelete}
      >
        Delete
      </Button>
      <div className="spacer" />
      <Button
        variant="outlined"
        onClick={onCancel}
        disabled={!onCancel}
      >
        Cancel
      </Button>
      <Button
        type="submit" variant="contained" color="primary"
        onClick={onSubmit}
        disabled={!onSubmit}
      >
        Save
      </Button>
    </div>
  );
};

export default OwnerControls;
