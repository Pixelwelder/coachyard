import { useDispatch, useSelector } from 'react-redux';
import { actions as courseActions, MODES, selectors as courseSelectors } from './courseSlice';
import React, { useState } from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText/DialogContentText';
import TextField from '@material-ui/core/TextField';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';

const ItemDialog = () => {
  const dispatch = useDispatch();
  const { newItemMode, newItem, upload } = useSelector(courseSelectors.select);
  const [file, setFile] = useState(null);

  const onUpload = ({ target: { files } }) => {
    if (!files.length) {
      setFile(null);
      dispatch(courseActions.setNewItem({ file: '' }))
      return;
    }

    const file = files[0];
    setFile(file);
    dispatch(courseActions.setNewItem({ file: file.name }))
  }

  const onSubmit = (event) => {
    event.preventDefault();
    if (newItemMode === MODES.CREATE) {
      dispatch(courseActions.addItemToCourse({ file }));
    } else {
      alert('Not implemented yet.');
    }
  };

  const isDisabled = () => {
    return false;
    return upload.isUploading || !file;
  };

  return (
    <Dialog
      open={newItemMode !== MODES.CLOSED}
      onClose={() => dispatch(courseActions.closeItem())}
      aria-labelledby="form-dialog-title"
    >
      <DialogTitle id="form-dialog-title">{newItem.displayName || 'Create New Item'}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Explanation...
        </DialogContentText>
        <form onSubmit={onSubmit}>
          <TextField
            autoFocus id="displayName" label="name" type="text"
            value={newItem.displayName}
            onChange={({ target: { value } }) => {
              dispatch(courseActions.setNewItem({ displayName: value }));
            }}
          />
          <TextField
            id="description" label="description" type="text"
            value={newItem.description}
            onChange={({ target: { value } }) => {
              dispatch(courseActions.setNewItem({ description: value }));
            }}
          />
          <input type="file" id="upload" onChange={onUpload} />
          {upload.isUploading && (
            <p>{Math.round((upload.bytesTransferred / upload.totalBytes) * 100)}%</p>
          )}
          <button className="invisible" type="submit" disabled={isDisabled()} />
        </form>
      </DialogContent>
      <DialogActions>
        {/*<Button onClick={() => setShowNewDialog(false)} color="primary">*/}
        {/*  Cancel*/}
        {/*</Button>*/}
        <Button
          onClick={onSubmit}
          color="primary"
          disabled={isDisabled()}
        >
          {newItemMode === MODES.CREATE ? 'Create' : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ItemDialog;
