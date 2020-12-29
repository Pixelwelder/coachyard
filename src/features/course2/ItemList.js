import React from 'react';
import Button from '@material-ui/core/Button';

import { selectors as selectedCourseSelectors } from './selectedCourseSlice';
import { useSelector } from 'react-redux';

const ItemList = () => {
  const { items } = useSelector(selectedCourseSelectors.select);

  return (
    <ul className="item-list">
      {items.map((item, index) => {
        return <li key={index}>{item.displayName}</li>;
      })}
    </ul>
  )
};

export default ItemList;
