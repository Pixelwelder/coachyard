import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectors as courseSelectors, actions as courseActions } from './courseSlice';
import { selectors as assetsSelectors, actions as assetsActions } from '../../app/assets';
import { selectors as appSelectors } from '../app/appSlice';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import RefreshIcon from '@material-ui/icons/Cached';
import EditIcon from '@material-ui/icons/Edit';
import Button from '@material-ui/core/Button';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText/DialogContentText';
import TextField from '@material-ui/core/TextField';
import DialogActions from '@material-ui/core/DialogActions';
import Dialog from '@material-ui/core/Dialog';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';

const Item = ({ item, onDelete, onEdit }) => {
  // const { id: playbackId } = item.playback_ids[0];
  // const width = 150;
  // const height = 100;

  return (
    <li>
      <div style={{ display: 'flex' }}>
        <h3>Item</h3>
        <Button onClick={onEdit}>
          <EditIcon />
        </Button>
        <Button onClick={onDelete}>
          <DeleteIcon />
        </Button>
      </div>
      <p>{item.displayName}</p>
      {/*<img*/}
      {/*  style={{ width, height }}*/}
      {/*  src={`https://image.mux.com/${playbackId}/thumbnail.jpg?width=${width}&height=${height}&fit_mode=pad`}*/}
      {/*  onClick={onClick}*/}
      {/*/>*/}
    </li>
  );
};

const CourseView = ({ course, items }) => {
  const dispatch = useDispatch();
  const { newItem, newItemIsOpen, upload } = useSelector(courseSelectors.select);
  const [file, setFile] = useState(null);

  const onUpload = ({ target: { files } }) => {
    if (!files.length) {
      setFile(null);
      dispatch(courseActions.setNewItem({ file: '' }))
      return;
    }

    const file = files[0];
    setFile(file);
    dispatch(courseActions.setNewItem({ file: file.name }))
  }

  const onSubmit = (event) => {
    event.preventDefault();
    dispatch(courseActions.addItemToCourse({ file }));
  };

  const isDisabled = () => {
    return false;
    return upload.isUploading || !file;
  }

  return (
    <div>
      {course && (
        <div>
          <div style={{ display: 'flex' }}>
            <p>{course.displayName}</p>
            <Button onClick={() => dispatch(courseActions.reloadCurrentCourse())}>
              <RefreshIcon />
            </Button>
            <Button onClick={() => {}}>
              <EditIcon />
            </Button>
            <Button onClick={() => dispatch(courseActions.setNewItemIsOpen(true))}>
              <AddIcon />
            </Button>
            <Button onClick={() => dispatch(courseActions.deleteSelectedCourse())}>
              <DeleteIcon />
            </Button>
          </div>
          <ul>
            {items.map((item, index) => (
              <Item
                item={item}
                key={index}
                onDelete={() => dispatch(courseActions.deleteItemFromCourse({ uid: item.uid }))}
                onEdit={() => dispatch(courseActions.editItem({ item, index }))}
              />
            ))}
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
            <input type="file" id="upload" onChange={onUpload} />
            {upload.isUploading && (
              <p>{Math.round((upload.bytesTransferred / upload.totalBytes) * 100)}%</p>
            )}
            <button className="invisible" type="submit" disabled={isDisabled()} />
          </form>
        </DialogContent>
        <DialogActions>
          {/*<Button onClick={() => setShowNewDialog(false)} color="primary">*/}
          {/*  Cancel*/}
          {/*</Button>*/}
          <Button
            onClick={onSubmit}
            color="primary"
            disabled={isDisabled()}
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
  const {
    newCourse, newCourseIsOpen, selectedCourse, selectedCourseData, selectedCourseItems, createdCourses
  } = useSelector(courseSelectors.select);

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
          {createdCourses.map((course, index) => {
            return <MenuItem value={course.uid} key={index}>{course.displayName}</MenuItem>;
          })}
        </Select>
        <Button onClick={() => {}}>
          <RefreshIcon />
        </Button>
        <Button onClick={() => dispatch(courseActions.setNewCourseIsOpen(true))}>
          <AddIcon />
        </Button>
      </div>
      <CourseView course={selectedCourseData} items={selectedCourseItems} />
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
