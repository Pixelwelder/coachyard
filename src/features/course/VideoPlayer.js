import React from 'react';
import { useSelector } from 'react-redux';

import { selectors as courseSelectors } from './courseSlice';
import './style.scss';
import ReactPlayer from 'react-player';

const VideoPlayer = () => {
  const { video } = useSelector(courseSelectors.select);
  const playbackId = (video?.playback_ids && video.playback_ids.length)
    ? video.playback_ids[0].id
    : null;

  return (
    <div className="video-player">
      Video: {video?.id}
      {playbackId && (
        <ReactPlayer
          width={400}
          height={300}
          style={{ border: '3px solid blue' }}
          url={`https://stream.mux.com/${playbackId}.m3u8`}
          controls={true}
        />
      )}
    </div>
  );
};

export default VideoPlayer;
