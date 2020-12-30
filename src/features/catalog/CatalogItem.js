import React from 'react';
import { Link } from 'react-router-dom';
import DeleteIcon from '@material-ui/icons/Delete';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import CardMedia from '@material-ui/core/CardMedia';
import CardActionArea  from '@material-ui/core/CardActionArea';
import Typography from '@material-ui/core/Typography';
import makeStyles from '@material-ui/core/styles/makeStyles';

const useStyles = makeStyles({
  media: {
    height: 140,
    backgroundSize: 'stretch'
  }
});

const CatalogItem = ({ item, onDelete, onSelect }) => {
  const { displayName, uid } = item;
  const classes = useStyles();

  return (
    <Card
      className="catalog-item"
      onClick={onSelect}
    >
      <CardActionArea>
        <CardMedia
          className={classes.media}
          title={displayName}
          image={'/images/generic-teacher-cropped.png'}
        />
        <CardContent>
          <Typography>
            {displayName}
          </Typography>
        </CardContent>
      </CardActionArea>
      <CardActions>
        {onDelete && (
          <Button onClick={() => onDelete(item)}>
            <DeleteIcon />
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default CatalogItem;
