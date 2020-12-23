import { useDispatch, useSelector } from 'react-redux';
import { actions as courseActions, MODES, selectors as courseSelectors } from './courseSlice';
import Button from '@material-ui/core/Button';
import EditIcon from '@material-ui/icons/Edit';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import SendIcon from '@material-ui/icons/Send';
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
            <Button onClick={() => dispatch(courseActions.openGiveCourseUI())}>
              <SendIcon />
            </Button>
            {mode === MODES.EDIT && (
              <>
                <Button onClick={() => dispatch(courseActions.editCourse())}>
                  <EditIcon />
                </Button>
                <Button onClick={() => dispatch(courseActions.createItem())}>
                  <AddIcon />
                </Button>
                <Button onClick={() => dispatch(courseActions.openDeleteCourseUI())}>
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
                onDelete={() => dispatch(courseActions.deleteItem({ uid: item.uid }))}
                onEdit={() => {
                  console.log(items);
                  dispatch(courseActions.editItem(item));
                }}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CourseView;
