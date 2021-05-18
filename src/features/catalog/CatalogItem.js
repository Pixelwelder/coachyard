import React, { useEffect, useState } from 'react';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import CardActionArea from '@material-ui/core/CardActionArea';
import Typography from '@material-ui/core/Typography';
import app from 'firebase/app';
import { useSelector } from 'react-redux';
import { selectors as catalogSelectors } from './catalogSlice';

const CatalogItem = ({ item = {}, onDelete, onSelect }) => {
  const tokensByParentUid = useSelector(catalogSelectors.selectTokensByParentUid);
  const tokensByCourseUid = useSelector(catalogSelectors.selectTokensByCourseUid);
  const accessibleTokensByCourseUid = useSelector(catalogSelectors.selectAccessibleTokensByCourseUid);
  const isCreator = item.creatorUid === app.auth().currentUser?.uid;
  const hasAccessToChild = !!tokensByParentUid[item.courseUid];
  const hasAccessToPublic = !!tokensByCourseUid[item.courseUid];
  const hasAccess = hasAccessToChild || hasAccessToPublic;

  const { displayName = '', user, price } = item;
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    const go = async () => {
      try {
        // TODO Load item image.
        const url = await app.storage().ref(`/avatars/${user}.png`).getDownloadURL();
        setImageUrl(url);
      } catch (error) {}
    };

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
        {/* TODO This should use new system. */}
        <CardMedia
          className="catalog-item-image"
          title={displayName}
          // image={imageUrl || '/images/generic-teacher-cropped.png'}
          image="/images/generic-teacher-cropped.png"
        >
          {isCreator && (
            <Typography className="catalog-item-type item-type">{item.isPublic ? 'published' : 'unpublished'}</Typography>
          )}
          {!isCreator && hasAccess && (
            <Typography className="catalog-item-type item-owned">Owned</Typography>
          )}
        </CardMedia>
        <CardContent>
          <Typography>{displayName}</Typography>
          {(!hasAccess || isCreator) && (
            <Typography variant="body2">
              {(price / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
      {/* <CardActions> */}
      {/*  {onDelete && ( */}
      {/*    <Button onClick={() => onDelete(item)}> */}
      {/*      <DeleteIcon /> */}
      {/*    </Button> */}
      {/*  )} */}
      {/* </CardActions> */}
    </Card>
  );
};

export default CatalogItem;
