import React, { useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
import Paper from '@material-ui/core/Paper';
import DeleteIcon from '@material-ui/icons/Delete';
import Button from '@material-ui/core/Button';
import { actions as catalogActions } from '../catalog/catalogSlice';
import { selectors as uiSelectors, actions as uiActions } from '../ui/uiSlice';
import { selectors as uiSelectors2, actions as uiActions2 } from '../ui/uiSlice2';
import { selectors as selectedCourseSelectors } from './selectedCourseSlice';
import { useDispatch, useSelector } from 'react-redux';
import DailyIframe from '@daily-co/daily-js';
import TextField from '@material-ui/core/TextField';
import LinearProgress from '@material-ui/core/LinearProgress';
import { DateTimePicker } from '@material-ui/pickers';
import { SizeMe } from 'react-sizeme';
import { DropzoneArea } from 'material-ui-dropzone';
import Typography from '@material-ui/core/Typography';
import { DateTime } from 'luxon';
import OwnerControls from '../../components/OwnerControls';
import MODES from '../ui/Modes';
import Alert from '@material-ui/lab/Alert';

const NoItem = () => {
  return (
    <p>No item.</p>
  );
};

const ScheduledMode = () => {
  const ownsCourse = useSelector(selectedCourseSelectors.selectOwnsCourse);
  const item = useSelector(selectedCourseSelectors.selectSelectedItem);
  const { course, student } = useSelector(selectedCourseSelectors.select);
  const dispatch = useDispatch();

  const formattedDate = DateTime.fromISO(item.date).toLocal().toLocaleString(DateTime.DATETIME_SHORT);
  const timeRemaining = DateTime.fromISO(item.date).toLocal().diff(DateTime.local())
    .toFormat('h:mm');

  const Teacher = () => {
    return (
      <>
        <div className="scheduled-mode-inner">
          <div className="item-info">
            <Typography className="participant-name" variant="h6" component="p">
              {student ? student.displayName : course.student}
            </Typography>
            <Typography className="meeting-date">{formattedDate} (in {timeRemaining})</Typography>
          </div>
          <Button
            color="primary" variant="contained"
            onClick={() => dispatch(catalogActions.launchItem(item))}
          >
            Launch
          </Button>
        </div>
        <div className="owner-controls">
          <Button variant="contained">
            Edit
          </Button>
        </div>
      </>

    );
  };

  const Student = () => {
    return (
      <Typography>Waiting to start...</Typography>
    );
  };

  return (
    <div className="item-mode scheduled-mode">
      {
        ownsCourse
          ? <Teacher />
          : <Student />
      }
    </div>
  );
};

const LiveMode = ({ size }) => {
  const ownsCourse = useSelector(selectedCourseSelectors.selectOwnsCourse);
  const { selectedItem: item } = useSelector(selectedCourseSelectors.select);
  const { uid, status } = item;
  const dispatch = useDispatch();
  const [callFrame, setCallFrame] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);

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

    _callFrame.on('recording-started', () => {
      setIsRecording(true);
      setHasRecorded(true);
    });
    _callFrame.on('recording-stopped', () => setIsRecording(false));

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
        <div className="owner-controls">
          {!hasRecorded && !isRecording && <Alert className="recording-warning" severity="error">Not recording!</Alert>}
          <Button
            color="primary" variant="contained"
            onClick={() => dispatch(catalogActions.endItem(item))}
            disabled={hasRecorded && isRecording}
          >
            End
          </Button>
        </div>
      )}
    </div>
  );
};

const EditView2 = () => {
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
  }, []);

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
    dispatch(actions.setValues({ date: value }));
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
    return isLoading;
  }

  return (
    <div className="edit-view">
      <form className="editing-form" onSubmit={onSubmit}>
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
        {
          isChangingFile
            ? (
              <>
                {
                  totalBytes > 0
                  ? <LinearProgress variant="determinate" value={percentUploaded} />
                  : <DropzoneArea
                      filesLimit={1}
                      maxFileSize={5000000000}
                      onChange={onUpload}
                    />
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
        {!isLoading && (
          <Button
            className="change-video-btn"
            variant="outlined"
            onClick={() => onChangeVideo(!isChangingFile)}
          >
            {isChangingFile ? 'Cancel' : 'Upload Video'}
          </Button>
        )}

        {item.status === "scheduled" && (
          <DateTimePicker
            value={date}
            onChange={onChangeDate}
          />
        )}
      </form>

      <div className="spacer" />
      <OwnerControls
        onSubmit={!isDisabled() && onSubmit}
        onCancel={!isDisabled() && onCancelEdit}
        onDelete={!isDisabled() && onDelete}
      />
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
          id="displayName" label="Name" name="displayName" type="text"
          variant="outlined"
          value={displayName}
          onChange={({ target: { value } }) => {
            dispatch(uiActions.setUI({ editItem: { ...editItem, displayName: value } }));
            // dispatch(courseActions.setNewItem({ displayName: value }));
          }}
        />
        <TextField
          id="description" label="Description" name="description" type="text"
          multiline rows={4} variant="outlined"
          value={description}
          onChange={({ target: { value } }) => {
            dispatch(uiActions.setUI({ editItem: { ...editItem, description: value } }))
            // dispatch(courseActions.setNewItem({ description: value }));
          }}
        />
        <DropzoneArea
          filesLimit={1}
          maxFileSize={5000000000}
          onChange={onUpload}
        />
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
  const { isOpen } = useSelector(uiSelectors2.editItem.select);
  const dispatch = useDispatch();

  return (
    <div className="item-mode viewing-mode">
      {
        isOpen
          ? <EditView2 />
          : (
            <>
              <Typography className="item-title" variant="h6" component="h3">{selectedItem.displayName}</Typography>
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
              <div className="spacer" />
              <div className="owner-controls">
                <Button
                  variant="contained"
                  onClick={() => dispatch(uiActions2.editItem.open())}
                >
                  Edit
                </Button>
              </div>
            </>
          )
      }
    </div>
  );
}

const ItemView = () => {
  const { selectedItem: item } = useSelector(selectedCourseSelectors.select);

  return (
    <Paper className="item-view" variant="outlined">
      <SizeMe
        monitorHeight
        monitorPosition
        refreshRate={500}
      >
        {({ size }) => (
          <div className={`item-view-content item-view-content-${item?.status || ''}`}>
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
