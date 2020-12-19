import { useDispatch, useSelector } from 'react-redux';
import { actions as courseActions, MODES, selectors as courseSelectors } from './courseSlice';
import Button from '@material-ui/core/Button';
import RefreshIcon from '@material-ui/icons/Cached';
import EditIcon from '@material-ui/icons/Edit';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import Item from './Item';
import React from 'react';

const CourseView = ({ course, items }) => {
  const dispatch = useDispatch();
  const { mode } = useSelector(courseSelectors.select);

  return (
    <div>
      {course && (
        <div>
          <div style={{ display: 'flex' }}>
            <p>{course.displayName}</p>
            <Button onClick={() => dispatch(courseActions.reloadCurrentCourse())}>
              <RefreshIcon />
            </Button>
            {mode === MODES.EDIT && (
              <>
                <Button onClick={() => alert('Not implemented.')}>
                  <EditIcon />
                </Button>
                <Button onClick={() => dispatch(courseActions.setNewItemIsOpen(true))}>
                  <AddIcon />
                </Button>
                <Button onClick={() => dispatch(courseActions.deleteSelectedCourse())}>
                  <DeleteIcon />
                </Button>
              </>
            )}
          </div>
          <ul>
            {items.map((item, index) => (
              <Item
                mode={mode}
                item={item}
                key={index}
                onDelete={() => dispatch(courseActions.deleteItemFromCourse({ uid: item.uid }))}
                onEdit={() => dispatch(courseActions.editItem({ item, index }))}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CourseView;
