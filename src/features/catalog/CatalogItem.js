import React from 'react';
import DeleteIcon from '@material-ui/icons/Delete';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import CardMedia from '@material-ui/core/CardMedia';
import CardActionArea  from '@material-ui/core/CardActionArea';
import Typography from '@material-ui/core/Typography';

const CatalogItem = ({ item = {}, onDelete, onSelect }) => {
  const { displayName = '' } = item;

  return (
    <Card
      className={`catalog-item${onSelect ? '' : ' placeholder'}`}
      onClick={onSelect}
      disabled={!onSelect}
      variant="outlined"
    >
      <CardActionArea>
        <CardMedia
          className="media"
          title={displayName}
          image={'/images/generic-teacher-cropped.png'}
        />
        <CardContent>
          <Typography>
            {displayName}
          </Typography>
        </CardContent>
      </CardActionArea>
      {/*<CardActions>*/}
      {/*  {onDelete && (*/}
      {/*    <Button onClick={() => onDelete(item)}>*/}
      {/*      <DeleteIcon />*/}
      {/*    </Button>*/}
      {/*  )}*/}
      {/*</CardActions>*/}
    </Card>
  );
};

export default CatalogItem;
