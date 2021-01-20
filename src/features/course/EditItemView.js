import { actions as uiActions2, selectors as uiSelectors2 } from '../ui/uiSlice2';
import { useDispatch, useSelector } from 'react-redux';
import { selectors as selectedCourseSelectors } from './selectedCourseSlice';
import React, { useEffect, useState } from 'react';
import { actions as catalogActions } from '../catalog/catalogSlice';
import MODES from '../ui/Modes';
import TextField from '@material-ui/core/TextField';
import LinearProgress from '@material-ui/core/LinearProgress';
import { Uploader } from './Uploader';
import ReactPlayer from 'react-player';
import Button from '@material-ui/core/Button';
import { DateTimePicker } from '@material-ui/pickers';
import OwnerControls from '../../components/OwnerControls';

const EditItemView = ({ requireUpload = false }) => {
  const { editItem: selectors } = uiSelectors2;
  const { editItem: actions } = uiActions2;

  const item = useSelector(selectedCourseSelectors.selectSelectedItem);
  const editItem = useSelector(selectors.select);
  const dispatch = useDispatch();
  const [file, setFile] = useState(null);

  const { displayName, description, date, isChangingFile, isLoading, bytesTransferred, totalBytes } = editItem;
  const percentUploaded = (bytesTransferred / totalBytes) * 100;

  useEffect(() => {
    onEdit();

    return () => {
      dispatch(actions.reset());
    }
  }, [item]);

  const onEdit = () => {
    dispatch(actions.open());
    dispatch(actions.setValues({
      displayName: item.displayName,
      description: item.description,
      date: item.date,
      file: item.file
    }));
  };

  const onCancelEdit = () => {
    dispatch(actions.reset());
  };

  const onChange = ({ target }) => {
    const { value } = target;
    const name = target.getAttribute('name');
    dispatch(actions.setValues({ [name]: value }));
  };

  const onChangeDate = (value) => {
    dispatch(actions.setValues({ date: value.toUTC().toString() }));
  };

  const onChangeVideo = (value) => {
    dispatch(actions.setValues({ isChangingFile: value }));
  }

  const onUpload = (files) => {
    if (!files.length) {
      setFile(null);
      dispatch(actions.setValues({ file: '' }));
    } else {
      const newFile = files[0];
      setFile(newFile);
      dispatch(actions.setValues({ file: newFile.name }));
    }
  }

  const onInputUpload = ({ target: { files } }) => {
    onUpload(files);
  }

  const onSubmit = async (event) => {
    event.preventDefault();

    const update = { displayName, description, file, date };
    dispatch(catalogActions.updateItem({ uid: item.uid, update, file }));
  };

  const onDelete = () => {
    dispatch(uiActions2.deleteItem.setValues({
      mode: MODES.OPEN,
      toDelete: item
    }));
  };

  const isDisabled = () => {
    return isLoading || totalBytes > 0;
  }

  return (
    <div className="edit-view">
      <form className="editing-form" onSubmit={onSubmit}>
        {true && (
          <>
            <TextField
              id="displayName" name="displayName" label="name" type="text"
              variant="outlined"
              disabled={isDisabled()}
              value={displayName}
              onChange={onChange}
            />
            <TextField
              id="description" name="description" label="description" type="text"
              multiline rows={4} variant="outlined"
              disabled={isDisabled()}
              value={description}
              onChange={onChange}
            />
          </>
        )}
        {
          (isChangingFile || !item.streamingId)
            ? (
              <>
                {
                  totalBytes > 0
                    ? <LinearProgress variant="determinate" value={percentUploaded}/>
                    : <Uploader onChange={onInputUpload}/>
                }
              </>
            )
            : (
              <>
                {
                  item.streamingId && (
                    <>
                      <ReactPlayer
                        className="edit-player"
                        width={300}
                        height={200}
                        url={`https://stream.mux.com/${item.playbackId}.m3u8`}
                        controls={true}
                      />
                    </>
                  )
                }
              </>
            )
        }
        {!!item.streamingId && !isLoading && (
          <Button
            className="change-video-btn"
            variant="outlined"
            onClick={() => onChangeVideo(!isChangingFile)}
          >
            {isChangingFile ? 'Cancel' : 'Upload Video'}
          </Button>
        )}

        {item.status === 'scheduled' && !requireUpload && (
          <DateTimePicker
            value={date}
            onChange={onChangeDate}
          />
        )}
      </form>

      <div className="spacer"/>
      <OwnerControls
        onSubmit={onSubmit}
        enableSubmit={!isDisabled() && !(requireUpload && !file)}
        onCancel={onCancelEdit}
        enableCancel={!!item.streamingId && !isDisabled()}
        onDelete={onDelete}
        enableDelete={!isDisabled()}
      />
    </div>
  );
};

export default EditItemView;
