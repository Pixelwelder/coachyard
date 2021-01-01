import { useDispatch, useSelector } from 'react-redux';
import { actions as courseActions, selectors as courseSelectors } from './courseSlice';
import MODES from '../ui/Modes';
import React, { useState } from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText/DialogContentText';
import TextField from '@material-ui/core/TextField';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import ReactPlayer from 'react-player';

const ItemDialog = () => {
  const dispatch = useDispatch();
  const { itemUI, newItem, upload } = useSelector(courseSelectors.select);
  const [file, setFile] = useState(null);
  const { playbackId } = newItem;

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
    if (itemUI.mode === MODES.CREATE) {
      dispatch(courseActions.addItemToCourse({ file }));
    } else {
      dispatch(courseActions.updateItem({ file }));
    }
  };

  const isDisabled = () => {
    return false;
    return upload.isUploading || !file;
  };

  return (
    <Dialog
      open={itemUI.mode !== MODES.CLOSED}
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

          {playbackId && (
            <ReactPlayer
              width={400}
              height={300}
              url={`https://stream.mux.com/${playbackId}.m3u8`}
              controls={true}
            />
          )}

          {itemUI.mode === MODES.CREATE && <input type="file" id="upload" onChange={onUpload} />}
          {itemUI.mode === MODES.EDIT && (
            <>
              {itemUI.isChangingFile && <input type="file" id="upload" onChange={onUpload} />}
              {!itemUI.isChangingFile && (
                <Button onClick={() => dispatch(courseActions.setItemUI({ isChangingFile: true }))}>
                  Update File
                </Button>
              )}
            </>
          )}
          {upload.isUploading && (
            <p>{Math.round((upload.bytesTransferred / upload.totalBytes) * 100)}%</p>
          )}
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
          {itemUI.mode === MODES.CREATE ? 'Create' : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ItemDialog;
