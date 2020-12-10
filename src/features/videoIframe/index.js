import React, { useEffect, useState } from 'react';
import DailyIframe from '@daily-co/daily-js';
import { useSelector } from 'react-redux';
import Button from '@material-ui/core/Button';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import { red } from '@material-ui/core/colors';

import { selectors as videoSelectors } from './videoSlice';

const Video = () => {
  const [callFrame, setCallFrame] = useState(null);
  const [isInMeeting, setIsInMeeting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const { url } = useSelector(videoSelectors.select);

  useEffect(() => {
    const callFrame = DailyIframe.createFrame({
      iframeStyle: {
        position: 'absolute',
        border: '1px solid black',
        'background-color': 'white',
        width: `${window.innerWidth - 32}px`,
        height: `${window.innerHeight - 308}px`,
        left: '16px',
        // right: '16px',
        top: '300px',
        // right: '1em',
        // bottom: '1em'
      }
    });

    callFrame.on('recording-started', () => setIsRecording(true));
    callFrame.on('recording-stopped', () => setIsRecording(false));
    callFrame.on('joined-meeting', (event) => setIsInMeeting(true));
    callFrame.on('left-meeting', (event) => setIsInMeeting(false));
    setCallFrame(callFrame);

    return () => {
      const stopRecording = async () => {
        setCallFrame(null);
        callFrame.stopRecording();
        await callFrame.destroy();
      }

      stopRecording();
    }
  }, []);

  useEffect(() => {
    if (callFrame && url) {
      callFrame.join({ url });
    }
  }, [url, callFrame]);

  const record = () => {
    callFrame.startRecording();
  }

  return (
    <div>
      {/*<Button disabled={!isInMeeting || isRecording} onClick={record}>*/}
      {/*  <FiberManualRecordIcon style={{ color: red[500] }} /> Record*/}
      {/*</Button>*/}
    </div>
  );
};

export default Video;
