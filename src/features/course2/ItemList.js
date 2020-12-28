import React from 'react';
import Button from '@material-ui/core/Button';

import { selectors as selectedCourseSelectors, actions as selectedCourseActions } from './selectedCourseSlice';
import { useSelector } from 'react-redux';

const ItemList = () => {
  const { items } = useSelector(selectedCourseSelectors.select);

  return (
    <div>
      <p>ItemList</p>
      <Button

      >
        Create New (new item dialog)
      </Button>
    </div>
  )
};

export default ItemList;
