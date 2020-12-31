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
import { selectors as selectedCourseSelectors } from './selectedCourseSlice';
import { useDispatch, useSelector } from 'react-redux';
import DailyIframe from '@daily-co/daily-js';

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

const IncompleteItem = ({ item }) => {
  const { uid, isInProgress } = item;
  const dispatch = useDispatch();
  const { url } = useSelector(videoSelectors.select);

  useEffect(() => {
    let callFrame;

    const go = async () => {
      console.log('--- GO ---');
      callFrame = DailyIframe.createFrame({
        iframeStyle: {
          position: 'absolute',
          border: '1px solid black',
          'background-color': 'white',
          width: `${window.innerWidth - 32}px`,
          height: `${window.innerHeight - 20}px`,
          left: '16px',
          // right: '16px',
          top: '300px',
          // right: '1em',
          // bottom: '1em'
        }
      });

      await callFrame.join({ url });
    };

    const stop = async () => {
      console.log('--- STOP ---');
      if (callFrame) {
        callFrame.stopRecording();
        await callFrame.destroy();
      }
    };

    if (url && isInProgress) {
      go();
    }

    return stop;
  }, [url, isInProgress]);

  return (
    <div>

    </div>
  );
};

const ItemView = ({ item }) => {
  const dispatch = useDispatch();
  const ownsCourse = useSelector(selectedCourseSelectors.selectOwnsCourse);

  const onEdit = () => {};
  const onDelete = () => {};

  return (
    <Paper className="item-view" variant="outlined">
      <p>? {ownsCourse}</p>
      <div className="item-view-content">
        {!item && <NoItem />}
        {item && (
          <>
            {item.isComplete && <CompleteItem item={item} />}
            {!item.isComplete && <IncompleteItem item={item} />}
          </>
        )}
      </div>
      <div className="item-view-controls">
        {ownsCourse && (
          <>
            <Button>
              <EditIcon onClick={onEdit} />
            </Button>
            <Button>
              <DeleteIcon onClick={onDelete} />
            </Button>
          </>
        )}
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
            {/*<Button*/}
            {/*  color="primary" variant="contained"*/}
            {/*  onClick={() => dispatch(videoActions.launch({ uid: item.uid }))}*/}
            {/*>*/}
            {/*  Enter*/}
            {/*</Button>*/}
            {item.isInProgress && (
              <>
                {ownsCourse && (
                  <Button
                    color="primary" variant="contained"
                    onClick={() => dispatch(videoActions.end({ uid: item.uid }))}
                  >
                    End
                  </Button>
                )}
                {!ownsCourse && (
                  <Button
                    color="primary" variant="contained"
                    onClick={() => dispatch(videoActions.join({ uid: item.uid }))}
                  >
                    Join
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
