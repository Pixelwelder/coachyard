import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { DropzoneArea } from 'material-ui-dropzone';
import capitalize from '@material-ui/core/utils/capitalize';
import { actions as assetsActions } from '../features/assets/assetsSlice';


const UploaderDialog = ({ onClose, type = '', filename }) => {
  const [files, setFiles] = useState([]);
  const dispatch = useDispatch();

  const onUpload = async () => {
    await dispatch(assetsActions.uploadAssets({
      filesByName: { [`/${type}/${filename}`]: files[0] }
    }));
    onClose()
  };

  return (
    <Dialog
      open={!!type}
      fullWidth
    >
      <DialogTitle>{'Upload Image'}</DialogTitle>
      <DialogContent>
        <DropzoneArea
          filesLimit={1}
          onChange={files => setFiles(files)}
          onClose={() => {}}
          acceptedFiles={['image/*']}
          dropzoneText={`Drag your image here or click to select`}
        />
        <DialogActions>
          <Button variant="contained" color="default" onClick={onClose}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={onUpload}>Upload</Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
};

export default UploaderDialog;
