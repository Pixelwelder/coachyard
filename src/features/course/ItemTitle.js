import React from 'react';
import Typography from '@material-ui/core/Typography';
import Chip from '@material-ui/core/Chip';
import capitalize from '@material-ui/core/utils/capitalize';

const ItemTitle = ({ item }) => {
  return (
    <div className="item-top-title">
      <Typography className="title-text" variant="h6" component="h3">{item.displayName}</Typography>
      <Chip label={capitalize(item.type)} color="primary" />
    </div>
  );
};

export default ItemTitle;
