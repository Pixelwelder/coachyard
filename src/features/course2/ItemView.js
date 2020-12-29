import React from 'react';
import ReactPlayer from 'react-player';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Paper from '@material-ui/core/Paper';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import Button from '@material-ui/core/Button';

const ItemView = ({ item }) => {
  const onEdit = () => {};
  const onDelete = () => {};

  return (
    <Paper className="item-view" variant="outlined">
      <div className="item-view-content">
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
      </div>
      <div className="item-view-controls">
        <Button>
          <EditIcon onClick={onEdit} />
        </Button>
        <Button>
          <DeleteIcon onClick={onDelete} />
        </Button>
      </div>
    </Paper>
  );
};

export default ItemView;
