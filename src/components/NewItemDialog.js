import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText/DialogContentText';
import TextField from '@material-ui/core/TextField';
import ReactPlayer from 'react-player';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';

import { actions as courseActions, MODES, selectors as courseSelectors } from '../features/course/courseSlice';
import { actions as uiActions, selectors as uiSelectors } from '../features/ui/uiSlice';

const ItemDialog = () => {
  const { newItemDialog } = useSelector(uiSelectors.select);
  const { open } = newItemDialog;

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
              style={{ border: '3px solid blue' }}
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
          {itemUI.mode === MODES.CREATE ? 'Create' : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewItemDialog;
