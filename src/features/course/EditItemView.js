import { useDispatch, useSelector } from 'react-redux';
import React, { useEffect, useState } from 'react';
import TextField from '@material-ui/core/TextField';
import LinearProgress from '@material-ui/core/LinearProgress';
import ReactPlayer from 'react-player';
import Button from '@material-ui/core/Button';
import { DateTimePicker } from '@material-ui/pickers';
import FormLabel from '@material-ui/core/FormLabel';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';
import FormControl from '@material-ui/core/FormControl';
import OwnerControls from '../../components/OwnerControls';
import { Uploader } from './Uploader';
import MODES from '../ui/Modes';
import { actions as catalogActions } from '../catalog/catalogSlice';
import { selectors as selectedCourseSelectors } from './selectedCourseSlice';
import { actions as uiActions2, selectors as uiSelectors2 } from '../ui/uiSlice2';
import { getDefaultDateTime } from '../../util/itemUtils';

const EditItemView = ({ requireUpload = false }) => {
  const { editItem: selectors } = uiSelectors2;
  const { editItem: actions } = uiActions2;

  const { course } = useSelector(selectedCourseSelectors.select);
  const selectedItem = useSelector(selectedCourseSelectors.selectSelectedItem);
  const editItem = useSelector(selectors.select);
  const dispatch = useDispatch();
  const [file, setFile] = useState(null);

  const {
    displayName, description, date, scheduler, isChangingFile, isLoading, bytesTransferred, totalBytes,
  } = editItem;
  const percentUploaded = (bytesTransferred / totalBytes) * 100;

  useEffect(() => {
    onEdit();

    return () => {
      dispatch(actions.reset());
    };
  }, [selectedItem]);

  const onEdit = () => {
    dispatch(actions.open());
    dispatch(actions.setValues({
      displayName: selectedItem.displayName,
      description: selectedItem.description,
      date: selectedItem.date || getDefaultDateTime(),
      file: selectedItem.file,
      scheduler: selectedItem.date ? 'teacher' : 'student',
      type: 'basic',
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
  };

  const onUpload = (files) => {
    if (!files.length) {
      setFile(null);
      dispatch(actions.setValues({ file: '' }));
    } else {
      const newFile = files[0];
      setFile(newFile);
      dispatch(actions.setValues({ file: newFile.name }));
    }
  };

  const onInputUpload = ({ target: { files } }) => {
    onUpload(files);
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    const update = {
      displayName,
      description,
      file,
      scheduler,
      date: scheduler === 'teacher' ? date : null,
    };
    dispatch(catalogActions.updateItem({
      courseUid: course.uid, itemUid: selectedItem.uid, update, file,
    }));
  };

  const onDelete = () => {
    dispatch(uiActions2.deleteItem.setValues({
      mode: MODES.OPEN,
      toDelete: selectedItem,
    }));
  };

  const isDisabled = () => isLoading || totalBytes > 0;

  return (
    <div className="edit-view">
      <form className="editing-form" onSubmit={onSubmit}>
        <TextField
          autoFocus
          id="displayName"
          name="displayName"
          label="name"
          type="text"
          variant="outlined"
          disabled={isDisabled()}
          value={displayName}
          onChange={onChange}
        />
        <TextField
          id="description"
          name="description"
          label="description"
          type="text"
          multiline
          rows={4}
          variant="outlined"
          disabled={isDisabled()}
          value={description}
          onChange={onChange}
        />
        {
          (selectedItem.status !== 'scheduled' && (isChangingFile || !selectedItem.streamingId))
            ? (
              <>
                {
                  totalBytes > 0
                    ? <LinearProgress variant="determinate" value={percentUploaded} />
                    : <Uploader onChange={onInputUpload} disabled={isDisabled()} />
                }
              </>
            )
            : (
              <>
                {
                  selectedItem.streamingId && (
                    <>
                      <ReactPlayer
                        className="edit-player"
                        width={300}
                        height={200}
                        url={`https://stream.mux.com/${selectedItem.playbackId}.m3u8`}
                        controls
                      />
                    </>
                  )
                }
              </>
            )
        }
        {!!selectedItem.streamingId && !isLoading && (
          <Button
            className="change-video-btn"
            variant="outlined"
            onClick={() => onChangeVideo(!isChangingFile)}
          >
            {isChangingFile ? 'Cancel' : 'Upload Video'}
          </Button>
        )}

        {selectedItem.status === 'scheduled' && (
          <FormControl component="fieldset" variant="outlined" className="scheduler-control">
            <FormLabel>Scheduled by:</FormLabel>
            <RadioGroup row aria-label="type" name="scheduler" value={scheduler} onChange={onChange}>
              <FormControlLabel value="teacher" control={<Radio />} label="Me" disabled={course.type !== 'basic'} />
              <FormControlLabel value="student" control={<Radio />} label="My Student" disabled={course.type !== 'basic'} />
            </RadioGroup>
          </FormControl>
        )}

        {scheduler === 'teacher' && selectedItem.status === 'scheduled' && (
          <FormControl className="date-control">
            <FormLabel>Date:</FormLabel>
            <DateTimePicker
              value={date}
              onChange={onChangeDate}
            />
          </FormControl>
        )}
      </form>

      <div className="spacer" />
      <OwnerControls
        onSubmit={onSubmit}
        enableSubmit={!isDisabled() && !(requireUpload && !file)}
        onCancel={onCancelEdit}
        enableCancel
        onDelete={onDelete}
        enableDelete={!isDisabled()}
      />
    </div>
  );
};

export default EditItemView;
