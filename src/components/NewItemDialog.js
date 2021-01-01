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

// import { actions as courseActions, MODES, selectors as courseSelectors } from '../features/course/courseSlice';
import { actions as uiActions, selectors as uiSelectors } from '../features/ui/uiSlice';
import { selectors as selectedCourseSelectors } from '../features/course2/selectedCourseSlice';
import MODES from '../features/ui/Modes';
import { actions as catalogActions } from '../features/catalog/catalogSlice';
import Alert from '@material-ui/lab/Alert';
import { DateTimePicker } from '@material-ui/pickers';
import Typography from '@material-ui/core/Typography';

const NewItemDialog = () => {
  const { newItemDialog } = useSelector(uiSelectors.select);
  const {
    courseUid, displayName, description, mode, onSubmit, bytesTransferred, totalBytes, isChangingFile, error, date
  } = newItemDialog;

  const { student } = useSelector(selectedCourseSelectors.select);
  const studentName = student?.displayName || 'Unknown';

  // const { itemUI, newItem, upload } = useSelector(courseSelectors.select);
  const dispatch = useDispatch();
  const [file, setFile] = useState(null);
  // const { playbackId } = newItem;

  const onUpload = ({ target: { files } }) => {
    if (!files.length) {
      setFile(null);
      dispatch(uiActions.setUI({ newItemDialog: { ...newItemDialog, file: file?.name || '', date } }));
      // dispatch(courseActions.setNewItem({ file: '' }))
      return;
    }

    const file = files[0];
    setFile(file);
    dispatch(uiActions.setUI({ newItemDialog: { ...newItemDialog, file: file.name } }));
    // dispatch(courseActions.setNewItem({ file: file.name }))
  }

  const _onSubmit = (event) => {
    event.preventDefault();
    if (mode === MODES.VIEW) {
      dispatch(catalogActions.addItemToCourse({
        courseUid,
        item: { displayName, description, file: file?.name || '', date },
        file
      }));
      // dispatch(courseActions.addItemToCourse({ file }));
    } else {
      alert('TODO');
      // dispatch(courseActions.updateItem({ file }));
    }
  };

  const isDisabled = () => {
    return false;
    return (totalBytes > 0) || !file;
  };

  return (
    <Dialog
      fullWidth
      open={mode !== MODES.CLOSED}
      onClose={() => dispatch(uiActions.resetDialog('newItemDialog'))}
      aria-labelledby="form-dialog-title"
    >
      <DialogTitle id="form-dialog-title">
        {mode === MODES.VIEW ? 'Create New Live Session' : `Edit Item`}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          {`Schedule a new Live Session with your student ${studentName}`}
        </DialogContentText>
        <form onSubmit={_onSubmit}>
          <TextField
            autoFocus id="displayName" label="name" type="text" variant="outlined"
            value={displayName}
            onChange={({ target: { value } }) => {
              dispatch(uiActions.setUI({ newItemDialog: { ...newItemDialog, displayName: value } }));
              // dispatch(courseActions.setNewItem({ displayName: value }));
            }}
          />
          <TextField
            id="description" label="description" type="text" variant="outlined"
            value={description}
            onChange={({ target: { value } }) => {
              dispatch(uiActions.setUI({ newItemDialog: { ...newItemDialog, description: value } }))
              // dispatch(courseActions.setNewItem({ description: value }));
            }}
          />
          <Typography>When is this Live Session?</Typography>
          <DateTimePicker
            value={date}
            onChange={value => {
              dispatch(uiActions.setUI({ newItemDialog: { ...newItemDialog, date: value } }));
            }}
          />

          {/*{playbackId && (*/}
          {/*  <ReactPlayer*/}
          {/*    width={400}*/}
          {/*    height={300}*/}
          {/*    style={{ border: '3px solid blue' }}*/}
          {/*    url={`https://stream.mux.com/${playbackId}.m3u8`}*/}
          {/*    controls={true}*/}
          {/*  />*/}
          {/*)}*/}

          {/*{mode === MODES.VIEW && <input type="file" id="upload" onChange={onUpload} />}*/}
          {mode === MODES.EDIT && (
            <>
              {isChangingFile && <input type="file" id="upload" onChange={onUpload} />}
              {!isChangingFile && (
                <Button
                  onClick={() => {
                    dispatch(uiActions.setUI({ newItemDialog: { ...newItemDialog, isChangingFile: true }}));
                  }}
                >
                  Update File
                </Button>
              )}
            </>
          )}
          {(totalBytes > 0) && (
            <p>{Math.round((bytesTransferred / totalBytes) * 100)}%</p>
          )}
        </form>
        {!!error && <Alert severity="error">{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => dispatch(uiActions.resetDialog('newItemDialog'))} color="primary">
          Cancel
        </Button>
        <Button
          onClick={_onSubmit}
          color="primary"
          disabled={isDisabled()}
        >
          {mode === MODES.VIEW ? 'Create' : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewItemDialog;
