import MODES from '../ui/Modes';
import Button from '@material-ui/core/Button';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import React from 'react';

const Item = ({ item, onDelete, onEdit, mode }) => {
  // const { id: playbackId } = item.playback_ids[0];
  // const width = 150;
  // const height = 100;

  return (
    <li>
      <div style={{ display: 'flex' }}>
        <h3>Item</h3>
        {mode === MODES.EDIT && (
          <>
            <Button onClick={onEdit}>
              <EditIcon />
            </Button>
            <Button onClick={onDelete}>
              <DeleteIcon />
            </Button>
          </>
        )}
      </div>
      <p>{item.displayName}</p>
      {/*<img*/}
      {/*  style={{ width, height }}*/}
      {/*  src={`https://image.mux.com/${playbackId}/thumbnail.jpg?width=${width}&height=${height}&fit_mode=pad`}*/}
      {/*  onClick={onClick}*/}
      {/*/>*/}
    </li>
  );
};

export default Item;
