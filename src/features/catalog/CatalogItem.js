import React, { useEffect, useState } from 'react';
import DeleteIcon from '@material-ui/icons/Delete';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import CardMedia from '@material-ui/core/CardMedia';
import CardActionArea  from '@material-ui/core/CardActionArea';
import Typography from '@material-ui/core/Typography';
import app from 'firebase/app';
import { selectors as catalogSelectors } from './catalogSlice';
import { useSelector } from 'react-redux';

const CatalogItem = ({ item = {}, onDelete, onSelect }) => {
  const { tokensByUser } = useSelector(catalogSelectors.select);
  const { displayName = '', user, price } = item;
  const [imageUrl, setImageUrl] = useState('');
  console.log('CatalogItem', item);

  useEffect(() => {
    const go = async () => {
      try {
        // TODO Load item image.
        const url = await app.storage().ref(`/avatars/${user}.png`).getDownloadURL();
        setImageUrl(url);
      } catch (error) {}
    }

    if (item) go();
  }, [item]);

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
          // image={imageUrl || '/images/generic-teacher-cropped.png'}
          image={'/images/generic-teacher-cropped.png'}
        />
        <CardContent>
          <Typography>{displayName}</Typography>
          {tokensByUser[app.auth().currentUser?.uid]
            ? (<Typography variant="body2">Owned</Typography>)
            : (
              <Typography variant="body2">
                {(price / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </Typography>
            )
          }
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
