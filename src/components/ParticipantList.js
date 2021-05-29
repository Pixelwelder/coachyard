import React, { useEffect } from 'react';
import Typography from '@material-ui/core/Typography';
import { useDispatch, useSelector } from 'react-redux';
import { actions as assetsActions, selectors as assetsSelectors } from '../features/assets/assetsSlice';

const Participant = ({ token }) => {
  const { images } = useSelector(assetsSelectors.select);
  const dispatch = useDispatch();

  const path = `/avatars/${token.user}`;
  const { [path]: imageUrl } = images;

  useEffect(() => {
    if (!imageUrl) {
      dispatch(assetsActions.getAsset({ path }));
    }
  }, [imageUrl]);

  return (
    <li className="token-item">
      <img src={imageUrl || '/images/generic-avatar-2.png'} className="item-info-image" />
      <Typography variant="h6">{token.userDisplayName}</Typography>
    </li>
  );
};

const ParticipantList = ({ tokens }) => (
  <ul className="participant-images">
    {
        tokens.map((token, index) => <Participant token={token} key={index} />)
      }
  </ul>
);

export default ParticipantList;
