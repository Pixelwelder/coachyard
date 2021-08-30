import React, { useRef, useState } from 'react';
import UploadIcon from '@material-ui/icons/CloudUploadSharp';
import CancelIcon from '@material-ui/icons/Cancel';
import CheckIcon from '@material-ui/icons/Check';
import Button from '@material-ui/core/Button';

const VideoUploader = ({ onSubmit }) => {
  const fileInputRef = useRef(null);
  const [isChanging, setIsChanging] = useState(false);
  const [file, setFile] = useState(null);

  const onChange = ({ target: { files } }) => {
    console.log('files', files);
    setFile(files.length ? files[0] : null);
  };

  const onBegin = () => {
    setIsChanging(true);
  };

  const onCancel = () => {
    setIsChanging(false);
  };

  const onUpload = async () => {
    await onSubmit(file);
    setIsChanging(false);
  };

  return (
    <div className="video-uploader">
      {!isChanging && (
        <Button
          className="upload-video-button"
          variant="contained"
          onClick={onBegin}
        >
          <UploadIcon fontSize="large" color="action" />
        </Button>
      )}
      {isChanging && (
        <>
          <div className="video-input-container">
            <input className="video-upload-input" ref={fileInputRef} type="file" onChange={onChange} />
            <Button
              className="video-upload-cancel"
              onClick={onCancel}
            >
              <CancelIcon color="action" />
            </Button>
          </div>
          <Button
            className="video-upload-submit"
            variant="contained"
            color="primary"
            disabled={!file}
            onClick={onUpload}
          >
            <UploadIcon fontSize="large" />
          </Button>
        </>
      )}
    </div>
  );
};

export default VideoUploader;
