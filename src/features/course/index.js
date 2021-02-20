import React, { useEffect, useState } from 'react';
import Grid from '@material-ui/core/Grid';
import { Link, useHistory, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  actions as selectedCourseActions,
  selectors as selectedCourseSelectors,
  SIDEBAR_MODES
} from './selectedCourseSlice';
import { actions as uiActions2 } from '../ui/uiSlice2';
import { selectors as userSelectors } from '../app/userSlice';
import './course.scss';
import ItemList from './ItemList';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import CourseSummary from './CourseSummary';
import ItemView from './ItemView';
import CourseView from './CourseView';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { CourseChat } from '../chat';
import { actions as catalogActions } from '../catalog/catalogSlice';
import { getDefaultDateTime } from '../../util/itemUtils';

const Course = () => {
  const { uid, itemUid } = useParams();
  const {
    course, courseCreator, selectedItem, isRecording, sidebarMode, numOutstandingChats
  } = useSelector(selectedCourseSelectors.select);
  const { isSignedIn } = useSelector(userSelectors.select);
  const ownsCourse = useSelector(selectedCourseSelectors.selectOwnsCourse);
  const history = useHistory();
  const dispatch = useDispatch();

  useEffect(() => {
    const go = async () => {
      await dispatch(selectedCourseActions.setUid({ uid, history }));
      await dispatch(selectedCourseActions.setSelectedItemUid({ uid: itemUid, history }));
    }

    if (isSignedIn) {
      go();
    }
  }, [uid, itemUid, isSignedIn]);

  const onCreate = async () => {
    // dispatch(uiActions2.createItem.open())
    const { payload } = await dispatch(catalogActions.createItem({
      courseUid: course.uid,
      item: { displayName: 'New Item', description: '', date: getDefaultDateTime(), file: '' }
    }));
    console.log('result', payload);
    history.push(`/course/${course.uid}/${payload.uid}`);
    dispatch(uiActions2.editItem.open());
  }

  return (
    <div className="app-content">
      <div className="course-header">
        <Typography variant="h6" component="h2">
          <Link
            to="/dashboard"
            onClick={(event) => {
              if (isRecording) {
                event.preventDefault();
                alert('Please stop the recording before navigating away.');
              }
            }}
          >
              Courses
          </Link> > {course?.displayName || ''}
        </Typography>
        {/*<Typography variant="body1">*/}
        {/*  {courseCreator?.displayName || ''}*/}
        {/*</Typography>*/}
      </div>
      <Grid
        container
        className="app-content-container"
      >
        <Grid
          item
          xs={12}
          sm={8}
          className="app-content-main"
        >
          {
            selectedItem
            ? <ItemView />
            : <CourseView />
          }
        </Grid>

        <Grid
          item
          xs={12}
          sm={4}
          className="app-content-toc"
        >
          <Paper className="toc-container" variant="outlined">
            <div className="toc-header">
              <CourseSummary />
            </div>
            <Tabs
              variant="fullWidth"
              value={sidebarMode}
              onChange={(event, newValue) => dispatch(selectedCourseActions.setSidebarMode(newValue))}
            >
              <Tab label="Content" />
              <Tab label={'Chat' + (numOutstandingChats > 0 ? ` (${numOutstandingChats})` : '')}/>
            </Tabs>
            {sidebarMode === SIDEBAR_MODES.CHAT && <CourseChat />}
            {sidebarMode === SIDEBAR_MODES.TOC && (
              <>
                <ItemList />
                <div className="toc-footer">
                  {ownsCourse && (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={onCreate}
                    >
                      Create New
                    </Button>
                  )}
                </div>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default Course;
