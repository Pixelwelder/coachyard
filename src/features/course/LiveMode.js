import { useDispatch, useSelector } from 'react-redux';
import { actions as selectedCourseActions, selectors as selectedCourseSelectors } from './selectedCourseSlice';
import React, { useEffect, useState } from 'react';
import DailyIframe from '@daily-co/daily-js';
import Button from '@material-ui/core/Button';
import FullscreenIcon from '@material-ui/icons/Fullscreen';
import FullscreenExitIcon from '@material-ui/icons/FullscreenExit';
import Alert from '@material-ui/lab/Alert';
import { actions as catalogActions } from '../catalog/catalogSlice';

export const LiveMode = ({ size }) => {
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
          {!isFullscreen ? <FullscreenIcon/> : <FullscreenExitIcon/>}
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
