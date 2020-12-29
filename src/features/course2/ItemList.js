import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import { selectors as selectedCourseSelectors } from './selectedCourseSlice';
import Item from './Item';

const ItemList = () => {
  const { items } = useSelector(selectedCourseSelectors.select);
  const [selectedUid, setSelectedUid] = useState(null);

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
            isSelected={item.uid === selectedUid}
            onSelect={() => {
              console.log('selected', item.uid);
              setSelectedUid(item.uid);
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
