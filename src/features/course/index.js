import React, { useEffect, useState } from 'react';
import Grid from '@material-ui/core/Grid';
import { useHistory, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import {
  actions as selectedCourseActions,
  selectors as selectedCourseSelectors,
  SIDEBAR_MODES
} from './selectedCourseSlice';
import { actions as uiActions2 } from '../ui/uiSlice2';
import { selectors as userSelectors } from '../app/userSlice';
import './course.scss';
import ItemList from './ItemList';
import CourseSummary from './CourseSummary';
import ItemView from './ItemView';
import CourseView from './CourseView';
import { CourseChat } from '../chat';
import { actions as catalogActions, selectors as catalogSelectors } from '../catalog/catalogSlice';
import { actions as billingActions2 } from '../billing2/billingSlice2';
import { selectHasAccessToCurrentCourse } from '../app/comboSelectors';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Typography from '@material-ui/core/Typography';
import { getPriceString } from '../../util/currency';

const Course = () => {
  const { courseUid, itemUid } = useParams();
  const {
    course, sidebarMode, numOutstandingChats
  } = useSelector(selectedCourseSelectors.select);
  const selectedItem = useSelector(selectedCourseSelectors.selectSelectedItem);
  const { isSignedIn } = useSelector(userSelectors.select);
  const hasAccess = useSelector(selectHasAccessToCurrentCourse);
  const isCreator = useSelector(selectedCourseSelectors.selectIsCreator);
  const isPurchasing = useSelector(selectedCourseSelectors.selectIsBeingPurchased);
  const ownsDescendant = useSelector(selectedCourseSelectors.selectOwnsDescendant);
  const ownedDescendant = useSelector(selectedCourseSelectors.selectOwnedDescendant);
  const history = useHistory();
  const dispatch = useDispatch();

  useEffect(() => {
    const go = async () => {
      await dispatch(selectedCourseActions.setLocation({ courseUid, itemUid, history }));
      // await dispatch(selectedCourseActions.setUid({ uid, history }));
      // await dispatch(selectedCourseActions.setSelectedItemUid({ courseUid: uid, itemUid, history }));
    };

    if (isSignedIn) {
      go();
    }
  }, [courseUid, itemUid, isSignedIn]);

  const [anchorEl, setAnchorEl] = useState(null);

  const getMenu = () => {
    // New items share their course's type.
    const items = [];
    if (isCreator) items.push({ name: 'viewing', displayName: 'Pre-Recorded Video', type: 'basic' });
    items.push({ name: 'scheduled', displayName: 'Live Session', type: course.type });
    // But creators can create basic items.
    return items;
  };

  const onOpen = (event) => {
    const menu = getMenu();
    if (menu.length === 1) {
      // Just do the first action.
      onCreate(menu[0]);
    } else {
      // Open the menu.
      setAnchorEl(event.currentTarget);
    }
  };

  const onClose = () => {
    setAnchorEl(null);
  };

  const onCreate = async ({ name, type }) => {
    // dispatch(uiActions2.createItem.open())
    onClose();
    const { payload } = await dispatch(catalogActions.createItem({
      courseUid: course.uid,
      item: {
        displayName: 'New Item', description: '', date: null, file: '', status: name, type
      },
      ui: { delay: 500 }
    }));
    if (payload?.uid) {
      history.push(`/course/${course.uid}/${payload.uid}`);
      dispatch(uiActions2.editItem.open());
    }
  };

  const onUnlock = async () => {
    await dispatch(billingActions2.setUI({ showUnlock: true }));
    // const result = await dispatch(selectedCourseActions.purchaseCourse());
    // history.push(`/${result.payload.uid}`);
  };

  const goToDescendant = () => {
    history.push(`/course/${ownedDescendant.courseUid}`);
  };

  return (
    <div className="app-content">
      <Dialog open={ownsDescendant} fullWidth>
        <DialogTitle>Channel Unlocked</DialogTitle>
        <DialogContent>
          <Typography>You are subscribed to this channel!</Typography>
          <DialogActions>
            <Button variant="contained" color="primary" onClick={goToDescendant}>Go!</Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
      <div className="course-header">
        {/* <Typography variant="h6" component="h2"> */}
        {/*  <Link */}
        {/*    to="/dashboard" */}
        {/*    onClick={(event) => { */}
        {/*      if (isRecording) { */}
        {/*        event.preventDefault(); */}
        {/*        alert('Please stop the recording before navigating away.'); */}
        {/*      } */}
        {/*    }} */}
        {/*  > */}
        {/*      Dashboard */}
        {/*  </Link> > {course?.displayName || ''} */}
        {/* </Typography> */}
        {/* <Typography variant="body1"> */}
        {/*  {courseCreator?.displayName || ''} */}
        {/* </Typography> */}
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
                label={`Chat${numOutstandingChats > 0 ? ` (${numOutstandingChats})` : ''}`}
                disabled={course?.type === 'template'}
              />
            </Tabs>
            {sidebarMode === SIDEBAR_MODES.CHAT && <CourseChat />}
            {sidebarMode === SIDEBAR_MODES.TOC && (
              <>
                <ItemList />
                <div className="toc-footer">
                  {hasAccess && isCreator && (
                    <>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={onOpen}
                      >
                        Add Item
                      </Button>
                      <Menu
                        id="create-new-menu"
                        anchorEl={anchorEl}
                        keepMounted
                        open={!!anchorEl}
                        onClose={onClose}
                      >
                        {getMenu().map((menuItem, index) => (
                          <MenuItem key={index} onClick={() => onCreate(menuItem)}>{menuItem.displayName}</MenuItem>
                        ))}
                      </Menu>
                    </>
                  )}
                  {ownsDescendant && (
                    <Button
                      variant="contained"
                      color="primary"
                      disabled
                    >
                      Owned
                    </Button>
                  )}
                  {isPurchasing && (
                    <Button
                      variant="contained"
                      color="primary"
                      disabled
                    >
                      Purchasing...
                    </Button>
                  )}
                  {!ownsDescendant && !isPurchasing && !hasAccess && course?.price && (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={onUnlock}
                    >
                      Unlock for {getPriceString(course)}
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
