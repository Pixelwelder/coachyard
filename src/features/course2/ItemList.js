import React from 'react';
import Button from '@material-ui/core/Button';

import { selectors as selectedCourseSelectors } from './selectedCourseSlice';
import { useSelector } from 'react-redux';

const ItemList = () => {
  const { items } = useSelector(selectedCourseSelectors.select);

  return (
    <div>
      <p>ItemList</p>
    </div>
  )
};

export default ItemList;
