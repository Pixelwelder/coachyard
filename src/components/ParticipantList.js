import React, { useEffect } from 'react';
import Typography from '@material-ui/core/Typography';
import { actions as assetsActions, selectors as assetsSelectors } from '../features/assets/assetsSlice';
import { useDispatch, useSelector } from 'react-redux';

const Participant = ({ token }) => {
  const { images } = useSelector(assetsSelectors.select);
  const dispatch = useDispatch();

  const path = `/avatars/${token.user}.png`;
  const { [path]: imageUrl } = images;
  console.log(token.user);

  useEffect(() => {
    if (!imageUrl) {
      dispatch(assetsActions.getAsset({ path }))
    }
  }, [imageUrl]);

  return (
    <li className="token-item">
      <img src={imageUrl || '/images/generic-avatar-2.png'} className="item-info-image" />
      <Typography>{token.userDisplayName}</Typography>
    </li>
  );
}

const ParticipantList = ({ tokens }) => {
  return (
    <ul className="participant-images">
      {
        tokens.map((token, index) => {
          return <Participant token={token} key={index} />;
        })
      }
    </ul>
  );
};

export default ParticipantList;
