import React from 'react';
import ReactPlayer from 'react-player';

const ItemView = ({ item }) => {
  return (
    <div className="item-view">
      {!item && (
        <p>No item.</p>
      )}
      {item && (
        <>
          {!item.playbackId && (
            <p>No video.</p>
          )}
          {item.playbackId && (
            <ReactPlayer
              width={'100%'}
              height={'100%'}
              style={{ border: '3px solid blue' }}
              url={`https://stream.mux.com/${item.playbackId}.m3u8`}
              controls={true}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ItemView;
