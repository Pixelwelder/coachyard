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
import DialogContentText from '@material-ui/core/DialogContentText/DialogContentText';
import FormControl from '@material-ui/core/FormControl';
import { TextField } from '@material-ui/core';
import FormLabel from '@material-ui/core/FormLabel';

const singular = type => type.slice(0, -1);

const UploaderDialog = ({ onClose, type = '', filename }) => {
  const [files, setFiles] = useState([]);
  const dispatch = useDispatch();
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('')

  const onChange = ({ target }) => {
    const { value } = target;
    const name = target.getAttribute('name');
    // dispatch(actions.setValues({ [name]: value }));
  };

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
      <DialogTitle>{`Add ${capitalize(singular(type))}`}</DialogTitle>
      <DialogContent>
        <div className="form">
          <TextField
            id="assetTitle"
            name="assetTitle"
            label="Attachment Name"
            className="form-item"
            type="text"
            variant="outlined"
            value={displayName}
            onChange={onChange}
          />
          <TextField
            id="description"
            name="description"
            label="description"
            type="text"
            multiline
            rows={2}
            variant="outlined"
            value={description}
            onChange={onChange}
          />
        </div>
        <DropzoneArea
          filesLimit={1}
          onChange={files => setFiles(files)}
          onClose={() => {}}
          dropzoneText={`Drag your ${singular(type)} here or click to select`}
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
