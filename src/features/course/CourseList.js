import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectors as courseSelectors, actions as courseActions } from './courseSlice';
import { selectors as assetsSelectors, actions as assetsActions } from '../../app/assets';
import { selectors as appSelectors } from '../app/appSlice';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import RefreshIcon from '@material-ui/icons/Cached';
import Button from '@material-ui/core/Button';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText/DialogContentText';
import TextField from '@material-ui/core/TextField';
import DialogActions from '@material-ui/core/DialogActions';
import Dialog from '@material-ui/core/Dialog';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';

const Item = ({ item, onClick }) => {
  // const { id: playbackId } = item.playback_ids[0];
  // const width = 150;
  // const height = 100;

  return (
    <li>
      <h3>Item</h3>
      <p>{item.displayName}</p>
      {/*<img*/}
      {/*  style={{ width, height }}*/}
      {/*  src={`https://image.mux.com/${playbackId}/thumbnail.jpg?width=${width}&height=${height}&fit_mode=pad`}*/}
      {/*  onClick={onClick}*/}
      {/*/>*/}
    </li>
  );
};

const CourseView = ({ course }) => {
  const dispatch = useDispatch();
  const { newItem, newItemIsOpen } = useSelector(courseSelectors.select);

  const onSubmit = (event) => {
    event.preventDefault();
    dispatch(courseActions.addItemToCourse());
  };

  return (
    <div>
      {course && (
        <div>
          <div style={{ display: 'flex' }}>
            <p>{course.displayName}</p>
            <Button onClick={() => dispatch(courseActions.setNewItemIsOpen(true))}>
              <AddIcon />
            </Button>
            <Button>
              <RefreshIcon />
            </Button>
          </div>
          <ul>
            {course.items.map((item, index) => <Item item={item} key={index} />)}
          </ul>
        </div>
      )}

      <Dialog
        open={newItemIsOpen}
        onClose={() => dispatch(courseActions.setNewItemIsOpen(false))}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">Create New Item</DialogTitle>
        <DialogContent>
          <DialogContentText>
            What would you like to call this item?
          </DialogContentText>
          <form onSubmit={onSubmit}>
            <TextField
              autoFocus id="displayName" label="name" type="text"
              value={newItem.displayName}
              onChange={({ target: { value } }) => {
                dispatch(courseActions.setNewItem({ displayName: value }));
              }}
            />
            <TextField
              id="description" label="description" type="text"
              value={newItem.description}
              onChange={({ target: { value } }) => {
                dispatch(courseActions.setNewItem({ description: value }));
              }}
            />
            <button className="invisible" type="submit" />
          </form>
        </DialogContent>
        <DialogActions>
          {/*<Button onClick={() => setShowNewDialog(false)} color="primary">*/}
          {/*  Cancel*/}
          {/*</Button>*/}
          <Button
            onClick={onSubmit}
            color="primary"
          >
            Create!
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

const CoursesCreated = () => {
  const dispatch = useDispatch();
  const courses = useSelector(appSelectors.selectCoursesCreated);
  const { newCourse, newCourseIsOpen, selectedCourse, selectedCourseData } = useSelector(courseSelectors.select);

  const onSubmit = (event) => {
    event.preventDefault();
    dispatch(courseActions.createCourse());
  };

  return (
    <div className="course-list">
      <h2>Course List</h2>
      <div style={{ display: 'flex', flexFlow: 'row nowrap' }}>
        <Select
          labelId="tracks-label"
          id="tracks-select"
          value={selectedCourse}
          onChange={({ target: { value } }) => dispatch(courseActions.setAndLoadSelectedCourse(value))}
        >
          {courses.map((course, index) => {
            return <MenuItem value={course} key={index}>{course}</MenuItem>;
          })}
        </Select>
        <Button onClick={() => dispatch(courseActions.setNewCourseIsOpen(true))}>
          <AddIcon />
        </Button>
        <Button onClick={() => dispatch(courseActions.deleteSelectedCourse())} disabled={!selectedCourse}>
          <DeleteIcon />
        </Button>
      </div>
      <CourseView course={selectedCourseData} />
      {/*<ul>*/}
      {/*  {courses.map((asset, index) => (*/}
      {/*    <Item key={index} item={asset} onClick={() => dispatch(courseActions.setVideo(asset))} />*/}
      {/*  ))}*/}
      {/*</ul>*/}

      <Dialog
        open={newCourseIsOpen}
        onClose={() => dispatch(courseActions.setNewCourseIsOpen(false))}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">Create New Course</DialogTitle>
        <DialogContent>
          <DialogContentText>
            What would you like to call this course?
          </DialogContentText>
          <form onSubmit={onSubmit}>
            <TextField
              autoFocus id="displayName" label="name" type="text"
              value={newCourse.displayName}
              onChange={({ target: { value } }) => {
                dispatch(courseActions.setNewCourse({ displayName: value }));
              }}
            />
            <TextField
              id="description" label="description" type="text"
              value={newCourse.description}
              onChange={({ target: { value } }) => {
                dispatch(courseActions.setNewCourse({ description: value }));
              }}
            />
            <button className="invisible" type="submit" />
          </form>
        </DialogContent>
        <DialogActions>
          {/*<Button onClick={() => setShowNewDialog(false)} color="primary">*/}
          {/*  Cancel*/}
          {/*</Button>*/}
          <Button
            onClick={onSubmit}
            color="primary"
          >
            Create!
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export { CoursesCreated };
