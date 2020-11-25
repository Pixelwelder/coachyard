import React, { useEffect } from 'react';
import DailyIframe from '@daily-co/daily-js';

const Video = () => {
  useEffect(() => {
    const callFrame = DailyIframe.createFrame({
      iframeStyle: {
        position: 'fixed',
        border: '1px solid black',
        'background-color': 'white',
        width: `${window.innerWidth - 32}px`,
        height: `${window.innerHeight - 168}px`,
        left: '16px',
        // right: '16px',
        top: '150px',
        // right: '1em',
        // bottom: '1em'
      }
    });
    callFrame.join({ url: 'https://you.daily.co/hello' });

    return () => {
      callFrame.destroy();
    }
  }, []);
  return (
    <div>

    </div>
  );
};

export default Video;
