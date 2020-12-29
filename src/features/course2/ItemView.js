import React from 'react';
import ReactPlayer from 'react-player';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';

const ItemView = ({ item }) => {
  return (
    <Card className="item-view">
      <CardContent>
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
                url={`https://stream.mux.com/${item.playbackId}.m3u8`}
                controls={true}
              />
            )}
          </>
      )}
      </CardContent>
    </Card>
  );
};

export default ItemView;
