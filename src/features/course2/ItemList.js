import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectors as selectedCourseSelectors, actions as selectedCourseActions } from './selectedCourseSlice';
import Item from './Item';

const ItemList = () => {
  const { items, selectedItemUid } = useSelector(selectedCourseSelectors.select);
  const dispatch = useDispatch();

  const onEdit = (item) => {

  };

  const onDelete = (item) => {

  };

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
            onEdit={() => onEdit(item)}
            onDelete={() => onDelete(item)}
          />
        );
      })}
    </ul>
  )
};

export default ItemList;
