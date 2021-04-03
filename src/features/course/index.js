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
import { selectHasAccessToCurrentCourse } from '../app/comboSelectors';
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';

const Course = () => {
  const { uid, itemUid } = useParams();
  const {
    course, selectedItem, isRecording, sidebarMode, numOutstandingChats
  } = useSelector(selectedCourseSelectors.select);
  const { isSignedIn } = useSelector(userSelectors.select);
  const hasAccess = useSelector(selectHasAccessToCurrentCourse);
  const ownsCourse = useSelector(selectedCourseSelectors.selectOwnsCourse);
  const history = useHistory();
  const dispatch = useDispatch();

  const getMenu = () => {
    const items = [{ name: 'scheduled', displayName: 'Live Session' }];
    if (!ownsCourse) items.push({ name: 'viewing', displayName: 'Pre-Recorded Video' });
    return items;
  };

  useEffect(() => {
    const go = async () => {
      await dispatch(selectedCourseActions.setUid({ uid, history }));
      await dispatch(selectedCourseActions.setSelectedItemUid({ courseUid: uid, itemUid, history }));
    }

    if (isSignedIn) {
      go();
    }
  }, [uid, itemUid, isSignedIn]);

  const [anchorEl, setAnchorEl] = useState(null);
  const onOpen = (event) => {
    const menu = getMenu();
    if (menu.length === 1) {
      // Just do the first action.
      const { name } = menu[0];
      onCreate(name);
    } else {
      // Open the menu.
      setAnchorEl(event.currentTarget);
    }
  };

  const onClose = () => {
    setAnchorEl(null);
  };

  const onCreate = async (status) => {
    // dispatch(uiActions2.createItem.open())
    const { payload } = await dispatch(catalogActions.createItem({
      courseUid: course.uid,
      item: { displayName: 'New Item', description: '', date: null, file: '', status }
    }));
    console.log('result', payload);
    history.push(`/course/${course.uid}/${payload.uid}`);
    dispatch(uiActions2.editItem.open());
    onClose();
  };

  const onUnlock = async () => {
    const result = await dispatch(selectedCourseActions.purchaseCourse());
    history.push(`/${result.payload.uid}`);
  };

  return (
    <div className="app-content">
      <div className="course-header">
        {/*<Typography variant="h6" component="h2">*/}
        {/*  <Link*/}
        {/*    to="/dashboard"*/}
        {/*    onClick={(event) => {*/}
        {/*      if (isRecording) {*/}
        {/*        event.preventDefault();*/}
        {/*        alert('Please stop the recording before navigating away.');*/}
        {/*      }*/}
        {/*    }}*/}
        {/*  >*/}
        {/*      Dashboard*/}
        {/*  </Link> > {course?.displayName || ''}*/}
        {/*</Typography>*/}
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
              <Tab
                label={'Chat' + (numOutstandingChats > 0 ? ` (${numOutstandingChats})` : '')}
                disabled={course?.type === 'template'}
              />
            </Tabs>
            {sidebarMode === SIDEBAR_MODES.CHAT && <CourseChat />}
            {sidebarMode === SIDEBAR_MODES.TOC && (
              <>
                <ItemList />
                <div className="toc-footer">
                  {ownsCourse && (
                    <>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={onOpen}
                      >
                        Create New
                      </Button>
                      <Menu
                        id="create-new-menu"
                        anchorEl={anchorEl}
                        keepMounted
                        open={!!anchorEl}
                        onClose={onClose}
                      >
                        {getMenu().map(({ name, displayName }) => (
                          <MenuItem onClick={() => onCreate(name)}>{displayName}</MenuItem>
                        ))}
                      </Menu>
                    </>
                  )}
                  {!hasAccess && course?.price && (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={onUnlock}
                    >
                      Unlock for {(course.price / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
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
