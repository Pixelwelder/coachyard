import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectors as couresSelectors, actions as courseActions } from './courseSlice';
import { selectors as assetsSelectors, actions as assetsActions } from '../../app/assets';

const Item = ({ item, onClick }) => {
  const { id: playbackId } = item.playback_ids[0];
  const width = 150;
  const height = 100;

  return (
    <li>
      <h3>Item</h3>
      <img
        style={{ width, height }}
        src={`https://image.mux.com/${playbackId}/thumbnail.jpg?width=${width}&height=${height}&fit_mode=pad`}
        onClick={onClick}
      />
    </li>
  );
};

const CourseList = () => {
  const assets = useSelector(assetsSelectors.selectAssets);
  const dispatch = useDispatch();

  return (
    <div className="course-list">
      <h2>Course List</h2>
      <ul>
        {assets.map((asset, index) => (
          <Item key={index} item={asset} onClick={() => dispatch(courseActions.setVideo(asset))} />
        ))}
      </ul>
    </div>
  );
};

export default CourseList;
