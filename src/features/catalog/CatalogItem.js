import React, { useEffect, useState } from 'react';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import CardActionArea from '@material-ui/core/CardActionArea';
import Typography from '@material-ui/core/Typography';
import app from 'firebase/app';
import { useDispatch, useSelector } from 'react-redux';
import { selectors as catalogSelectors } from './catalogSlice';
import { selectors as dashboardSelectors } from '../dashboard/dashboardSlice';
import { getPriceString } from '../../util/currency';
import { actions as assetsActions, selectors as assetsSelectors } from '../assets/assetsSlice';

const CatalogItem = ({ item = {}, onSelect }) => {
  const tokensByParentUid = useSelector(catalogSelectors.selectTokensByParentUid);
  const tokensByCourseUid = useSelector(catalogSelectors.selectTokensByCourseUid);
  const isCreator = item.creatorUid === app.auth().currentUser?.uid;
  const hasAccessToChild = !!tokensByParentUid[item.courseUid];
  const hasAccessToPublic = !!tokensByCourseUid[item.courseUid];
  const hasAccess = hasAccessToChild || hasAccessToPublic;
  const { images, dirtyFlags } = useSelector(assetsSelectors.select);
  const studentTokensByAdminTokenUid = useSelector(dashboardSelectors.selectStudentTokensByAdminTokenUid);
  const dispatch = useDispatch();

  const { displayName = '', user, price, uid } = item;

  const getCreatorString = () => {
    const { [uid]: studentTokens = [] } = studentTokensByAdminTokenUid;
    if (studentTokens.length) {
      let str = studentTokens[0].userDisplayName;
      if (studentTokens.length > 1) str += ' (...)'
      return str;
    } else {
      return ('No Students')
    }
    // return item.type === 'template' ? 'template' : 'channel';
  };

  // '/images/generic-teacher-cropped.png'
  const path = `/courses/${item.courseUid || item.uid}`;
  const { [path]: imageUrl } = images;
  useEffect(() => {
    if (!imageUrl) dispatch(assetsActions.getAsset({ path }));
  }, [imageUrl]);

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
          // image="/images/generic-teacher-cropped.png"
          image={imageUrl}
        >
          {isCreator && (
            <Typography className="catalog-item-type item-type">{getCreatorString()}</Typography>
          )}
          {!isCreator && hasAccess && (
            <Typography className="catalog-item-type item-owned">Owned</Typography>
          )}
        </CardMedia>
        <CardContent>
          <Typography>{displayName}</Typography>
          {(!hasAccess || isCreator) && (
            <Typography variant="body2">
              {getPriceString(item)}
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default CatalogItem;
