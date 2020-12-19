import { useDispatch, useSelector } from 'react-redux';
import { actions as courseActions, selectors as courseSelectors } from './courseSlice';
import React, { useState } from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText/DialogContentText';
import TextField from '@material-ui/core/TextField';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';

const NewItemDialog = () => {
  const dispatch = useDispatch();
  const { newItemIsOpen, newItem, upload } = useSelector(courseSelectors.select);
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
    dispatch(courseActions.addItemToCourse({ file }));
  };

  const isDisabled = () => {
    return false;
    return upload.isUploading || !file;
  };

  return (
    <Dialog
      open={newItemIsOpen}
      onClose={() => dispatch(courseActions.setNewItemIsOpen(false))}
      aria-labelledby="form-dialog-title"
    >
      <DialogTitle id="form-dialog-title">Create New Item</DialogTitle>
      <DialogContent>
        <DialogContentText>
          What would you like to call this item?
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
          Create!
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewItemDialog;
