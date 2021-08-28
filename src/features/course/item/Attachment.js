import Typography from '@material-ui/core/Typography';
import { selectors as selectedCourseSelectors } from '../selectedCourseSlice';
import { useDispatch, useSelector } from 'react-redux';
import Button from '@material-ui/core/Button';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import CheckIcon from '@material-ui/icons/Check';
import CancelIcon from '@material-ui/icons/Cancel';
import FileIcon from '@material-ui/icons/InsertDriveFile';
import DownloadIcon from '@material-ui/icons/CloudDownload';
import TextField from '@material-ui/core/TextField';
import React, { useEffect, useState } from 'react';
import { DropzoneArea } from 'material-ui-dropzone';
import { actions as selectedCourseActions } from '../selectedCourseSlice';
import app from 'firebase';
import mimeTypes from 'mime-types';
import downloadFile from '../../../util/downloadFile';

const Attachment = ({ attachment, onEdit, onStopEdit, isEditing }) => {
  const ownsCourse = useSelector(selectedCourseSelectors.selectOwnsCourse);
  const [localAttachment, setLocalAttachment] = useState({ ...attachment });
  const [file, setFile] = useState(null)
  const dispatch = useDispatch();

  const onChange = ({ target: { name, value } }) => {
    console.log('onChange', name, value);
    setLocalAttachment({
      ...localAttachment,
      [name]: value
    });
  };

  const onSetFiles = (files) => {
    if (files.length) {
      setFile(files[0])
    } else {
      setFile(null);
    }
  };

  const onSave = async () => {
    console.log('onSave', localAttachment, file);
    dispatch(selectedCourseActions.updateAttachment({ attachment: localAttachment, file }))
    onStopEdit();
  };

  const onDownload = async () => {
    const ref = app.storage().ref(`/attachments/${attachment.uid}`);
    await downloadFile(ref, attachment);
  };

  useEffect(() => {
    if (isEditing) {
      setLocalAttachment({ ...attachment });
    }
  }, [isEditing])

  return (
    <div className="attachment">
      <div className="attachment-image" onClick={onDownload}>
        <FileIcon fontSize="large" color="primary" />
      </div>
      <div className="attachment-info">
        {!isEditing && (
          <>
            <Typography className="attachment-title" variant="h6">{localAttachment.displayName}</Typography>
            <Typography>{localAttachment.description}</Typography>
            <Button className="attachment-download" size="small" variant="contained" color="primary" onClick={onDownload}>
              <DownloadIcon fontSize="small" />
            </Button>
          </>
        )}

        {isEditing && (
          <>
            <TextField
              value={localAttachment.displayName} name="displayName" title="Name" variant="outlined"
              onChange={onChange}
            />
            <TextField
              value={localAttachment.description} name="description" title="Description" variant="outlined" multiline rows={2}
              onChange={onChange}
            />
            <DropzoneArea
              filesLimit={1}
              onChange={onSetFiles}
              onClose={() => {}}
              dropzoneText={`Drag your attachment here or click to select`}
            />
          </>
        )}
      </div>
      {ownsCourse && (
        <div className="attachment-buttons">
          {!isEditing && (
            <>
              <Button size="small" variant="contained" onClick={onEdit}>
                <EditIcon fontSize="small" />
              </Button>
            </>
          )}
          {isEditing && (
            <>
              <Button size="small" variant="contained" color="secondary">
                <DeleteIcon fontSize="small" />
              </Button>
              <Button size="small" variant="contained" color="primary" onClick={onSave}>
                <CheckIcon fontSize="small" />
              </Button>
              {/*<Button size="small" variant="contained">*/}
              {/*  <CancelIcon fontSize="small" onClick={onStopEdit} />*/}
              {/*</Button>*/}
            </>
          )}
        </div>
      )}
    </div>
  )
};

export default Attachment;
