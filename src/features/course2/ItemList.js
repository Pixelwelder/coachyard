import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectors as selectedCourseSelectors, actions as selectedCourseActions } from './selectedCourseSlice';
import { selectors as catalogSelectors, actions as catalogActions } from '../catalog/catalogSlice';
import { actions as uiActions } from '../ui/uiSlice';
import Item from './Item';

const ItemList = () => {
  const { items, selectedItemUid } = useSelector(selectedCourseSelectors.select);
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
              dispatch(selectedCourseActions.setSelectedItemUid(item.uid));
            }}
          />
        );
      })}
    </ul>
  )
};

export default ItemList;
