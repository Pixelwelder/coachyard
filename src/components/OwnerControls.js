import React from 'react';
import Button from '@material-ui/core/Button';

const OwnerControls = ({
  onDelete, enableDelete = true, onCancel, enableCancel = true, onSubmit, enableSubmit = true,
}) => (
  <div className="owner-controls">
    <Button
      variant="contained"
      color="secondary"
      onClick={onDelete}
      disabled={!enableDelete}
    >
      Delete
    </Button>
    <div className="spacer" />
    <Button
      variant="outlined"
      onClick={onCancel}
      disabled={!enableCancel}
    >
      Cancel
    </Button>
    <Button
      type="submit"
      variant="contained"
      color="primary"
      onClick={onSubmit}
      disabled={!enableSubmit}
    >
      Save
    </Button>
  </div>
);

export default OwnerControls;
