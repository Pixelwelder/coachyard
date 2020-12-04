import React, { useEffect, useState } from 'react';
import DailyIframe from '@daily-co/daily-js';

import { selectors as videoSelectors } from './videoSlice';
import { useSelector } from 'react-redux';

const Video = () => {
  const [callFrame, setCallFrame] = useState(null);
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
    console.log('video: setting url!', url);
    if (callFrame && url) {
      callFrame.join({ url });
      callFrame.startRecording(); // TODO This should be explicit but not easily missed.
    }
  }, [url, callFrame]);
  return (
    <div>

    </div>
  );
};

export default Video;
