import React, { useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Paper from '@material-ui/core/Paper';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import Button from '@material-ui/core/Button';
import { actions as videoActions, selectors as videoSelectors } from '../videoIframe/videoSlice';
import { actions as catalogActions } from '../catalog/catalogSlice';
import { MODES, selectors as uiSelectors, actions as uiActions } from '../ui/uiSlice';
import { selectors as selectedCourseSelectors } from './selectedCourseSlice';
import { useDispatch, useSelector } from 'react-redux';
import DailyIframe from '@daily-co/daily-js';
import TextField from '@material-ui/core/TextField';
import { DateTimePicker } from '@material-ui/pickers';
import { SizeMe } from 'react-sizeme';

const NoItem = () => {
  return (
    <p>No item.</p>
  );
};

const CompleteItem = ({ item }) => {
  return (
    <>
      {!item.playbackId && (
        <p>No video.</p>
      )}

      {item.playbackId && (
        <ReactPlayer
          width={'100%'}
          height={'100%'}
          url={`https://stream.mux.com/${item.playbackId}.m3u8`}
          controls={true}
        />
      )}
    </>
  );
};

// const IncompleteItem = ({ item }) => {
//   const { uid, isInProgress } = item;
//   const dispatch = useDispatch();
//   const { url } = useSelector(videoSelectors.select);
//
//   useEffect(() => {
//     let callFrame;
//
//     const go = async () => {
//       console.log('--- GO ---');
//       callFrame = DailyIframe.createFrame({
//         iframeStyle: {
//           position: 'absolute',
//           border: '1px solid black',
//           'background-color': 'white',
//           width: `${window.innerWidth - 32}px`,
//           height: `${window.innerHeight - 20}px`,
//           left: '16px',
//           // right: '16px',
//           top: '300px',
//           // right: '1em',
//           // bottom: '1em'
//         }
//       });
//
//       await callFrame.join({ url });
//     };
//
//     const stop = async () => {
//       console.log('--- STOP ---');
//       if (callFrame) {
//         callFrame.stopRecording();
//         await callFrame.destroy();
//       }
//     };
//
//     if (url && isInProgress) {
//       go();
//     }
//
//     return stop;
//   }, [url, isInProgress]);
//
//   return (
//     <div>
//
//     </div>
//   );
// };

const ScheduledMode = () => {
  const ownsCourse = useSelector(selectedCourseSelectors.selectOwnsCourse);

  return (
    <div>
      {ownsCourse && (
        <p>Start</p>
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
      document.getElementById('live-mode'),
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
          console.log('stopped');
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
      console.log('joined');
    };

    if (callFrame && (status === 'live')) {
      go();
    }
  }, [callFrame, uid, status]);

  useEffect(() => {
    if (callFrame) {
      console.log('resizing');
      const iframe = callFrame.iframe();
      // iframe.width = size.width;
      // iframe.height = size.height;
      // iframe.left = size.position.left;
      // iframe.top = size.position.top;
    }
  }, [callFrame, size]);

  return (
    <div className="live-mode" id="live-mode">
      {/*{ownsCourse && (*/}
      {/*  <Button onClick={() => alert('Not implemented')}>*/}
      {/*    Stop*/}
      {/*  </Button>*/}
      {/*)}*/}
    </div>
  );
};

const EditView = ({ onCancel, onSubmit }) => {
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

  const onUpload = ({ target: { files } }) => {
    if (!files.length) {
      setFile(null);
      dispatch(uiActions.setUI({ editItem: { ...editItem, file: file?.name || '', date } }));
      // dispatch(courseActions.setNewItem({ file: '' }))
      return;
    }

    const file = files[0];
    setFile(file);
    dispatch(uiActions.setUI({ editItem: { ...editItem, file: file.name } }));
    // dispatch(courseActions.setNewItem({ file: file.name }))
  }

  const _onSubmit = (event) => {
    event.preventDefault();

    const update = { displayName, description, file, date };
    dispatch(catalogActions.updateItem({ uid: selectedItem.uid, update, file }))
    // onSubmit();
  }

  return (
    <div>
      <p>Editing...</p>
      <form>
        <TextField
          autoFocus id="displayName" label="name" type="text"
          value={displayName}
          onChange={({ target: { value } }) => {
            dispatch(uiActions.setUI({ editItem: { ...editItem, displayName: value } }));
            // dispatch(courseActions.setNewItem({ displayName: value }));
          }}
        />
        <TextField
          id="description" label="description" type="text"
          value={description}
          onChange={({ target: { value } }) => {
            dispatch(uiActions.setUI({ editItem: { ...editItem, description: value } }))
            // dispatch(courseActions.setNewItem({ description: value }));
          }}
        />
        <input type="file" id="upload" onChange={onUpload} />
        <DateTimePicker
          value={date}
          onChange={value => {
            dispatch(uiActions.setUI({ editItem: { ...editItem, date: value } }));
          }}
        />
      </form>
      {onCancel && (
        <Button onClick={onCancel}>Cancel</Button>
      )}
      <Button onClick={_onSubmit}>Submit</Button>
      <Button>
        <DeleteIcon onClick={() => alert('Not implemented')} />
      </Button>
    </div>
  );
};

const ProcessingMode = () => {
  const ownsCourse = useSelector(selectedCourseSelectors.selectOwnsCourse);

  return (
    <div>
      {ownsCourse && (
        <EditView />
      )}
      {!ownsCourse && (
        <p>Processing...</p>
      )}
    </div>
  );
};

const ViewingMode = ({ size }) => {
  const ownsCourse = useSelector(selectedCourseSelectors.selectOwnsCourse);
  const { selectedItem } = useSelector(selectedCourseSelectors.select);
  const { editItem } = useSelector(uiSelectors.select);
  const dispatch = useDispatch();

  console.log('size', size);

  return (
    <>
      {
        editItem.mode === MODES.VIEW
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
            </>
          )
      }
    </>
  );
}

const ItemView = () => {
  const dispatch = useDispatch();
  const ownsCourse = useSelector(selectedCourseSelectors.selectOwnsCourse);
  const { selectedItem: item } = useSelector(selectedCourseSelectors.select);

  const onEdit = () => {};
  const onDelete = () => {};

  console.log('ItemView.item', item);

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
      <div className="item-view-controls">
        {item && (
          <>
            {ownsCourse && (
              <>
                {item.status === 'scheduled' && (
                  <Button
                    color="primary" variant="contained"
                    onClick={() => dispatch(catalogActions.launchItem(item))}
                  >
                    Launch
                  </Button>
                )}
                {item.status === 'live' && (
                  <Button
                    color="primary" variant="contained"
                    onClick={() => dispatch(catalogActions.endItem(item))}
                  >
                    End
                  </Button>
                )}
              </>
            )}
          </>
        )}
      </div>
    </Paper>
  );
};

export default ItemView;
