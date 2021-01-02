import React from 'react';
import MODES from '../features/ui/Modes';
import { actions as uiActions } from '../features/ui/uiSlice';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText/DialogContentText';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { DateTimePicker } from '@material-ui/pickers';
import Button from '@material-ui/core/Button';
import Alert from '@material-ui/lab/Alert';
import DialogActions from '@material-ui/core/DialogActions';
import Dialog from '@material-ui/core/Dialog';

const CreateItemDialog = () => {
  const onUpload = () => {};
  const onSubmit = () => {};
  const isDisabled = () => {};

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
          {`Schedule a new Live Session with your student ${studentName}.`}
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

export default CreateItemDialog;
