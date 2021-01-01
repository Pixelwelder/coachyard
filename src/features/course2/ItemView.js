import React, { useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
import Paper from '@material-ui/core/Paper';
import DeleteIcon from '@material-ui/icons/Delete';
import Button from '@material-ui/core/Button';
import { actions as catalogActions } from '../catalog/catalogSlice';
import { MODES, selectors as uiSelectors, actions as uiActions } from '../ui/uiSlice';
import { selectors as selectedCourseSelectors } from './selectedCourseSlice';
import { useDispatch, useSelector } from 'react-redux';
import DailyIframe from '@daily-co/daily-js';
import TextField from '@material-ui/core/TextField';
import { DateTimePicker } from '@material-ui/pickers';
import { SizeMe } from 'react-sizeme';
import { DropzoneArea } from 'material-ui-dropzone';
import TextareaAutosize from '@material-ui/core/TextareaAutosize';

const NoItem = () => {
  return (
    <p>No item.</p>
  );
};

const ScheduledMode = () => {
  const ownsCourse = useSelector(selectedCourseSelectors.selectOwnsCourse);
  const item = useSelector(selectedCourseSelectors.selectSelectedItem);
  const dispatch = useDispatch();

  return (
    <div>
      {ownsCourse && (
        <Button
          color="primary" variant="contained"
          onClick={() => dispatch(catalogActions.launchItem(item))}
        >
          Launch
        </Button>
      )}
      {!ownsCourse && (
        <p>Waiting to start...</p>
      )}
    </div>
  );
};

const LiveMode = ({ size }) => {
  const ownsCourse = useSelector(selectedCourseSelectors.selectOwnsCourse);
  const { selectedItem: item } = useSelector(selectedCourseSelectors.select);
  const { uid, status } = item;
  const dispatch = useDispatch();
  const [callFrame, setCallFrame] = useState(null);

  useEffect(() => {
    const _callFrame = DailyIframe.createFrame(
      document.getElementById('live-mode-target'),
      {
        iframeStyle: {
          // position: 'absolute',
          border: '1px solid black',
          'background-color': 'white',
          width: '100%', //`${window.innerWidth - 32}px`,
          height: '100%', //`${window.innerHeight - 20}px`,
          // left: '16px',
          // right: '16px',
          top: 0,
          // right: '1em',
          // bottom: '1em'
        }
      }
    );

    const stop = () => {
      const execute = async () => {
        if (callFrame) {
          callFrame.stopRecording(); // TODO Necessary?
          await callFrame.destroy();
          setCallFrame(null);
        }
      }

      execute();
    };

    setCallFrame(_callFrame);

    return stop;
  }, []);

  useEffect(() => {
    const go = async () => {
      const url = `https://coachyard.daily.co/${uid}`;
      await callFrame.join({ url });
    };

    if (callFrame && (status === 'live')) {
      go();
    }
  }, [callFrame, uid, status]);

  useEffect(() => {
    if (callFrame) {
      const iframe = callFrame.iframe();
      // iframe.width = size.width;
      // iframe.height = size.height;
      // iframe.left = size.position.left;
      // iframe.top = size.position.top;
    }
  }, [callFrame, size]);

  return (
    <div className="item-mode live-mode">
      <div id="live-mode-target">

      </div>
      {ownsCourse && (
        <div id="owner-controls">
          <Button
            color="primary" variant="contained"
            onClick={() => dispatch(catalogActions.endItem(item))}
          >
            End
          </Button>
        </div>
      )}
    </div>
  );
};

const EditView = ({ onCancel, onSubmit, variant }) => {
  const { editItem } = useSelector(uiSelectors.select);
  const { selectedItem } = useSelector(selectedCourseSelectors.select);
  const dispatch = useDispatch();
  const [file, setFile] = useState(null);

  useEffect(() => {
    dispatch(uiActions.setUI({ editItem: { ...editItem, ...selectedItem } }));
  }, [selectedItem])

  const {
    courseUid, displayName, description, mode, bytesTransferred, totalBytes, isChangingFile, error, date
  } = editItem;

  // const onUpload = ({ target: { files } }) => {
  const onUpload = (files) => {
    if (!files.length) {
      setFile(null);
      dispatch(uiActions.setUI({ editItem: { ...editItem, file: file?.name || '', date } }));
      // dispatch(courseActions.setNewItem({ file: '' }))
      return;
    }

    const newFile = files[0];
    setFile(newFile);
    dispatch(uiActions.setUI({ editItem: { ...editItem, file: newFile.name } }));
    // dispatch(courseActions.setNewItem({ file: file.name }))
  }

  const _onSubmit = (event) => {
    event.preventDefault();

    const update = { displayName, description, file, date };
    dispatch(catalogActions.updateItem({ uid: selectedItem.uid, update, file }))
    // onSubmit();
  }

  return (
    <div className="item-mode editing-mode">
      <form className="editing-form">
        <TextField
          id="displayName" label="name" type="text"
          variant="outlined"
          value={displayName}
          onChange={({ target: { value } }) => {
            dispatch(uiActions.setUI({ editItem: { ...editItem, displayName: value } }));
            // dispatch(courseActions.setNewItem({ displayName: value }));
          }}
        />
        <TextField
          id="description" label="description" type="text"
          multiline rows={4} variant="outlined"
          value={description}
          onChange={({ target: { value } }) => {
            dispatch(uiActions.setUI({ editItem: { ...editItem, description: value } }))
            // dispatch(courseActions.setNewItem({ description: value }));
          }}
        />
        <DropzoneArea onChange={onUpload} />
        {variant !== "processing" && (
          <DateTimePicker
            value={date}
            onChange={value => {
              dispatch(uiActions.setUI({ editItem: { ...editItem, date: value } }));
            }}
          />
        )}
      </form>
      {onCancel && (
        <Button onClick={onCancel}>Cancel</Button>
      )}
      <div className="spacer" />
      <Button variant="contained" color="primary" onClick={_onSubmit}>
        Save
      </Button>
      {variant !== "processing" && (
        <>
          <Button onClick={() => alert('Not implemented')}>
            <DeleteIcon />
          </Button>
        </>
      )}
    </div>
  );
};

const ProcessingMode = () => {
  const ownsCourse = useSelector(selectedCourseSelectors.selectOwnsCourse);

  return (
    <div className="item-mode processing-mode">
      {ownsCourse && (
        <EditView variant="processing" />
      )}
      {!ownsCourse && (
        <p>Processing...</p>
      )}
    </div>
  );
};

const ViewingMode = ({ size }) => {
  const { selectedItem } = useSelector(selectedCourseSelectors.select);
  const { editItem } = useSelector(uiSelectors.select);

  return (
    <div className="item-mode viewing-mode">
      <p>Viewing</p>
      {
        editItem.mode === MODES.EDIT
          ? <EditView />
          : (
            <>
              {selectedItem?.playbackId && (
                <div className="player-wrapper">
                  <ReactPlayer
                    width={"100%"}
                    height={"100%"}
                    url={`https://stream.mux.com/${selectedItem.playbackId}.m3u8`}
                    controls={true}
                  />
                </div>
              )}
              {/*<Button*/}
              {/*  onClick={() => dispatch(uiActions.openDialog({ name: 'editItem' }))}*/}
              {/*>*/}
              {/*  <EditIcon />*/}
              {/*</Button>*/}
              <div className="owner-controls">

              </div>
            </>
          )
      }
    </div>
  );
}

const ItemView = () => {
  const dispatch = useDispatch();
  const ownsCourse = useSelector(selectedCourseSelectors.selectOwnsCourse);
  const { selectedItem: item } = useSelector(selectedCourseSelectors.select);

  const onEdit = () => {};
  const onDelete = () => {};

  return (
    <Paper className="item-view" variant="outlined">
      <SizeMe
        monitorHeight
        monitorPosition
        refreshRate={500}
      >
        {({ size }) => (
          <div className={`item-view-content item-view-content-${item?.status | ''}`}>
            {!item && <NoItem />}
            {item && (
              <>
                {item.status === 'scheduled' && <ScheduledMode />}
                {item.status === 'live' && <LiveMode size={size} />}
                {item.status === 'processing' && <ProcessingMode />}
                {item.status === 'viewing' && <ViewingMode size={size} />}
              </>
            )}
          </div>
        )}
      </SizeMe>
    </Paper>
  );
};

export default ItemView;
