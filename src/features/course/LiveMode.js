import { useDispatch, useSelector } from 'react-redux';
import { actions as selectedCourseActions, selectors as selectedCourseSelectors } from './selectedCourseSlice';
import React, { useEffect, useState } from 'react';
import DailyIframe from '@daily-co/daily-js';
import Button from '@material-ui/core/Button';
import FullscreenIcon from '@material-ui/icons/Fullscreen';
import FullscreenExitIcon from '@material-ui/icons/FullscreenExit';
import Alert from '@material-ui/lab/Alert';
import { actions as catalogActions } from '../catalog/catalogSlice';

const LiveMode = ({ size }) => {
  const ownsCourse = useSelector(selectedCourseSelectors.selectOwnsCourse);
  const { selectedItem: item, isRecording, isFullscreen } = useSelector(selectedCourseSelectors.select);
  const { uid, status } = item;
  const dispatch = useDispatch();
  const [callFrame, setCallFrame] = useState(null);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [inSession, setInSession] = useState(false);

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

  const onJoin = async () => {
    setHasJoined(true);
    const url = `https://coachyard.daily.co/${uid}`;
    await callFrame.join({ url });
    setInSession(true);
  }

  const onLeave = async () => {
    await callFrame.leave();
    setInSession(false);
  }

  const onEnd = () => {
    dispatch(catalogActions.endItem(item))
  }

  console.log('inSession', inSession);
  return (
    <div className="item-mode live-mode">
      <div id="live-mode-target" className={isFullscreen ? 'full-screen' : ''}>
        <Button
          className="full-screen-button" variant="contained" color="primary"
          onClick={() => dispatch(selectedCourseActions.setIsFullscreen(!isFullscreen))}
        >
          {!isFullscreen ? <FullscreenIcon/> : <FullscreenExitIcon/>}
        </Button>
      </div>
      <div className="owner-controls">
        {ownsCourse && !hasRecorded && !isRecording && (
          <Alert className="recording-warning" severity="error">Not recording!</Alert>
        )}
        {inSession
          ? (
            <Button
              color="primary" variant="contained"
              onClick={onLeave}
              disabled={hasRecorded && isRecording}
            >
              Leave
            </Button>
          )
          : (
            <>
              <Button
                color="secondary" variant="contained"
                onClick={onEnd}
              >
                End
              </Button>
              <Button
                color="primary" variant="contained"
                onClick={onJoin}
              >
                Join
              </Button>
            </>
          )
        }

      </div>
    </div>
  );
};

export default LiveMode;
