import React from 'react';
import ReactPlayer from 'react-player';

const ItemView = ({ item }) => {
  return (
    <div className="item-view">
      {!item && (
        <p>No item.</p>
      )}
      {item && (
        <div>
          <p>{item.displayName}</p>
          {item.playbackId && (
            <ReactPlayer
              width={400}
              height={300}
              style={{ border: '3px solid blue' }}
              url={`https://stream.mux.com/${item.playbackId}.m3u8`}
              controls={true}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ItemView;
