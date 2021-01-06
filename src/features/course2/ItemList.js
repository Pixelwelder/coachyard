import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { selectors as selectedCourseSelectors, actions as selectedCourseActions } from './selectedCourseSlice';
import Item from './Item';

const ItemList = () => {
  const { items, selectedItemUid } = useSelector(selectedCourseSelectors.select);
  const history = useHistory();

  return (
    <ul className="item-list">
      {items.map((item, index) => {
        return (
          <Item
            item={item}
            key={index}
            isSelected={item.uid === selectedItemUid}
            onSelect={() => {
              history.push(`/course/${item.courseUid}/${item.uid}`);
              // dispatch(selectedCourseActions.setSelectedItemUid(item.uid));
            }}
          />
        );
      })}
    </ul>
  )
};

export default ItemList;
