import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { selectors as selectedCourseSelectors, actions as selectedCourseActions } from './selectedCourseSlice';
import Item from './Item';
import { actions as uiActions2 } from '../ui/uiSlice2';

const ItemList = () => {
  const { items, selectedItemUid, isRecording } = useSelector(selectedCourseSelectors.select);
  const history = useHistory();
  const dispatch = useDispatch();

  return (
    <ul className="item-list">
      {items.map((item, index) => {
        return (
          <Item
            item={item}
            key={index}
            isSelected={item.uid === selectedItemUid}
            onSelect={() => {
              if (isRecording) {
                alert('Please stop the recording before navigating away.');
              } else {
                history.push(`/course/${item.courseUid}/${item.uid}`);
                dispatch(uiActions2.editItem.reset());
                // dispatch(selectedCourseActions.setSelectedItemUid(item.uid));
              }
            }}
          />
        );
      })}
    </ul>
  )
};

export default ItemList;
