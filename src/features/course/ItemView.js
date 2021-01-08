import React, { useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
import Paper from '@material-ui/core/Paper';
import DeleteIcon from '@material-ui/icons/Delete';
import { useLocation, Redirect } from 'react-router-dom';
import queryString from 'query-string';
import Button from '@material-ui/core/Button';
import { actions as catalogActions } from '../catalog/catalogSlice';
import { selectors as uiSelectors, actions as uiActions } from '../ui/uiSlice';
import { selectors as uiSelectors2, actions as uiActions2 } from '../ui/uiSlice2';
import { selectors as selectedCourseSelectors, actions as selectedCourseActions } from './selectedCourseSlice';
import { useDispatch, useSelector } from 'react-redux';
import DailyIframe from '@daily-co/daily-js';
import TextField from '@material-ui/core/TextField';
import LinearProgress from '@material-ui/core/LinearProgress';
import FullscreenIcon from '@material-ui/icons/Fullscreen';
import FullscreenExitIcon from '@material-ui/icons/FullscreenExit';
import { DateTimePicker } from '@material-ui/pickers';
import { SizeMe } from 'react-sizeme';
import { DropzoneArea } from 'material-ui-dropzone';
import Typography from '@material-ui/core/Typography';
import { DateTime } from 'luxon';
import OwnerControls from '../../components/OwnerControls';
import MODES from '../ui/Modes';
import Alert from '@material-ui/lab/Alert';
import Barebones from '../barebones';

const NoItem = () => {
  return (
    <p>No item.</p>
  );
};

const ScheduledMode = () => {
  const ownsCourse = useSelector(selectedCourseSelectors.selectOwnsCourse);
  const item = useSelector(selectedCourseSelectors.selectSelectedItem);
  const { course, student, selectedItem, courseCreator } = useSelector(selectedCourseSelectors.select);
  const { isOpen } = useSelector(uiSelectors2.editItem.select);
  const dispatch = useDispatch();

  const formattedDate = DateTime.fromISO(item.date).toLocal().toLocaleString(DateTime.DATETIME_SHORT);
  const timeRemaining = DateTime.fromISO(item.date).toLocal().diff(DateTime.local())
    .toFormat('h:mm');

  const Teacher = () => {
    return (
      <>
        <div className="mode-inner">
          {
            isOpen
              ? <EditView />
              : (
                <>
                  <div className="centered-mode">
                    <div className="item-info">
                      <Typography className="participant-name" variant="h6" component="p">
                        {selectedItem.displayName}
                      </Typography>
                      <Typography className="meeting-date">Scheduled for {formattedDate} (in {timeRemaining})</Typography>
                    </div>
                    <Button
                      color="primary" variant="contained"
                      onClick={() => dispatch(catalogActions.launchItem(item))}
                    >
                      Launch
                    </Button>
                  </div>
                  {/*<div className="owner-controls">*/}
                  {/*  <Button variant="contained" onClick={() => {}}>*/}
                  {/*    Edit*/}
                  {/*  </Button>*/}
                  {/*</div>*/}
                </>
              )
          }
        </div>
      </>

    );
  };

  const Student = () => {
    return (
      <div className="mode-inner">
        <div className="item-info">
          <Typography>Waiting for</Typography>
          <Typography className="participant-name" variant="h6" component="p">
            {courseCreator.displayName}
          </Typography>
          <Typography className="meeting-date">Scheduled for {formattedDate} (in {timeRemaining})</Typography>
        </div>
      </div>
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

const InitializingMode = () => {
  return (
    <div className="item-mode processing-mode">
        <div className="mode-inner">
          <div className="item-info">
            <Typography className="participant-name" variant="h6" component="p">
              Starting Up Live Session
            </Typography>
            <Typography>Be with you in a sec...</Typography>
          </div>
        </div>
    </div>
  );
};

const LiveMode = ({ size }) => {
  const ownsCourse = useSelector(selectedCourseSelectors.selectOwnsCourse);
  const { selectedItem: item, isRecording, isFullscreen } = useSelector(selectedCourseSelectors.select);
  const { uid, status } = item;
  const dispatch = useDispatch();
  const [callFrame, setCallFrame] = useState(null);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

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
      dispatch(selectedCourseActions.setIsRecording(true));
      setHasRecorded(true);
    });
    _callFrame.on('recording-stopped', () => dispatch(selectedCourseActions.setIsRecording(false)));

    const stop = () => {
      const execute = async () => {
        if (callFrame) {
          setHasJoined(false);
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
      setHasJoined(true);
      const url = `https://coachyard.daily.co/${uid}`;
      await callFrame.join({ url });
    };

    if (!hasJoined && callFrame && (status === 'live')) {
      go();
    }
  }, [callFrame, uid, status, hasJoined]);

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
      <div id="live-mode-target" className={isFullscreen ? 'full-screen' : ''}>
        <Button
          className="full-screen-button" variant="contained" color="primary"
          onClick={() => dispatch(selectedCourseActions.setIsFullscreen(!isFullscreen))}
        >
          {!isFullscreen ? <FullscreenIcon /> : <FullscreenExitIcon />}
        </Button>
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

const EditView = ({ requireUpload = false }) => {
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
          (isChangingFile || !item.streamingId)
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
        {!!item.streamingId && !isLoading && (
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

const ProcessingMode = () => {
  const ownsCourse = useSelector(selectedCourseSelectors.selectOwnsCourse);

  return (
    <div className="item-mode processing-mode">
      {ownsCourse && (
        <EditView requireUpload />
      )}
      {!ownsCourse && (
        <div className="mode-inner">
          <div className="item-info">
            <Typography className="participant-name" variant="h6" component="p">
              Live Session complete!
            </Typography>
            <Typography>Your video is processing and will be available shortly.</Typography>
          </div>
        </div>
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
          ? <EditView />
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
  const ownsCourse = useSelector(selectedCourseSelectors.selectOwnsCourse);
  const location = useLocation();
  const query = queryString.parse(location.search);
  const { barebones } = query;

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
                {item.status === 'initializing' && <InitializingMode />}
                {item.status === 'live' && (
                  <>
                    {
                      barebones === 'true'
                        ? <Redirect to={`/barebones?id=${item.uid}`} />
                        : <LiveMode size={size} />
                    }
                  </>
                )}
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
