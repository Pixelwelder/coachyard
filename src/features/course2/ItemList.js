import React from 'react';
import { useSelector } from 'react-redux';

import { selectors as selectedCourseSelectors } from './selectedCourseSlice';
import Item from './Item';

const ItemList = () => {
  const { items } = useSelector(selectedCourseSelectors.select);

  const onEdit = () => {};
  const onDelete = () => {};

  return (
    <ul className="item-list">
      {items.map((item, index) => {
        return <Item item={item} key={index} onEdit={onEdit} onDelete={onDelete} />;
      })}
    </ul>
  )
};

export default ItemList;
