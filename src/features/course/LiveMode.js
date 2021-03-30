import { useDispatch, useSelector } from 'react-redux';
import { actions as selectedCourseActions, selectors as selectedCourseSelectors } from './selectedCourseSlice';
import React, { useEffect, useState } from 'react';
import DailyIframe from '@daily-co/daily-js';
import Button from '@material-ui/core/Button';
import Alert from '@material-ui/lab/Alert';
import { actions as catalogActions } from '../catalog/catalogSlice';
import Typography from '@material-ui/core/Typography';
import ParticipantList from '../../components/ParticipantList';
import ItemInfo from './ItemInfo';

const LiveMode = ({ size }) => {
  const ownsCourse = useSelector(selectedCourseSelectors.selectOwnsCourse);
  const { selectedItem, isRecording, isFullscreen } = useSelector(selectedCourseSelectors.select);
  const studentTokens = useSelector(selectedCourseSelectors.selectStudentTokens);
  const adminTokens = useSelector(selectedCourseSelectors.selectAdminTokens);
  const dispatch = useDispatch();
  const [callFrame, setCallFrame] = useState(null);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [inSession, setInSession] = useState(false);

  useEffect(() => {
    const _callFrame = DailyIframe.createFrame(
      document.getElementById('live-mode-target'),
      {
        // showLeaveButton: true,
        showFullscreenButton: true,
        userName: 'Testing',
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
          console.log('stop daily');
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

  const onJoin = () => {
    const url = `https://coachyard.daily.co/${selectedItem.uid}`;
    setInSession(true);
    callFrame.join({ url });
  };

  const onLeave = () => {
    // dispatch(catalogActions.endItem(item))
    setInSession(false);
    callFrame.leave();
  };

  const onEnd = () => {
    // TODO Verify.
    dispatch(catalogActions.endItem(selectedItem));
  };

  const shouldShowWarning = () => {
    return ownsCourse && !hasRecorded && !isRecording;
  };

  // useEffect(() => {
  //   const go = async () => {
  //     setHasJoined(true);
  //     const url = `https://coachyard.daily.co/${uid}`;
  //     await callFrame.join({ url });
  //   };
  //
  //   if (!hasJoined && callFrame && (status === 'live')) {
  //     go();
  //   }
  // }, [callFrame, uid, status, hasJoined]);

  useEffect(() => {
    if (callFrame) {
      const iframe = callFrame.iframe();
      // iframe.width = size.width;
      // iframe.height = size.height;
      // iframe.left = size.position.left;
      // iframe.top = size.position.top;
    }
  }, [callFrame, size]);

  const getSessionClasses = () => {
    let classes = '';
    if (isFullscreen) classes = `full-screen ${classes}`;
    if (!inSession) classes = `out-of-session ${classes}`;

    return classes;
  }

  const tokens = ownsCourse ? studentTokens : adminTokens;

  const OwnerControls = () => {
    // Out of session, only the teacher sees controls.
    if (!inSession) {
      if (!ownsCourse) return null;
      return (
        <div className="owner-controls">
          <div className="spacer" />
          <Button
            color="secondary" variant="contained"
            onClick={onEnd}
            disabled={hasRecorded && isRecording}
          >
            End
          </Button>
        </div>
      );
    } else {
      // In session, both see the same thing.
      return (
        <div className="owner-controls">
          {shouldShowWarning()
            ? <Alert className="recording-warning" severity="error">Not recording!</Alert>
            : <div className="spacer" />
          }
          <Button
            color="primary" variant="contained"
            onClick={onLeave}
            disabled={hasRecorded && isRecording}
          >
            Leave
          </Button>
        </div>
      );
    }
  };

  return (
    <div className="item-mode live-mode">
      <div id="live-mode-target" className={getSessionClasses()}>
        {/*<Button*/}
        {/*  className="full-screen-button" variant="contained" color="primary"*/}
        {/*  onClick={() => dispatch(selectedCourseActions.setIsFullscreen(!isFullscreen))}*/}
        {/*>*/}
        {/*  {!isFullscreen ? <FullscreenIcon/> : <FullscreenExitIcon/>}*/}
        {/*</Button>*/}
      </div>
      {!inSession && (
        <div className="out-of-session-container mode-inner">
          <ItemInfo item={selectedItem} status={'This session is currently live.'} tokens={tokens} />
          <Button
            color="primary" variant="contained"
            onClick={onJoin}
            disabled={hasRecorded && isRecording}
          >
            Join
          </Button>
        </div>
      )}
      <OwnerControls />
    </div>
  );
};

export default LiveMode;
