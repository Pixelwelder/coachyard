import { useDispatch, useSelector } from 'react-redux';
import { selectors as selectedCourseSelectors } from './selectedCourseSlice';
import { actions as uiActions2, selectors as uiSelectors2 } from '../ui/uiSlice2';
import { actions as scheduleActions, selectors as scheduleSelectors } from '../schedule/scheduleSlice';
import { DateTime } from 'luxon';
import EditItemView from './EditItemView';
import Button from '@material-ui/core/Button';
import { actions as catalogActions } from '../catalog/catalogSlice';
import React, { useEffect, useState } from 'react';
import Iframe from 'react-iframe';
import { easy } from '../../config';
import ItemInfo from './ItemInfo';

const getDateTime = ({ course, item }) => {
  if (!item.date) {
    return {
      str: course.type === 'template'
        ? 'This course is a template.'
        : 'This Live Session has not yet been scheduled.'
    }
  }

  const formattedDate = DateTime.fromISO(item.date).toLocal().toLocaleString(DateTime.DATETIME_SHORT);
  const diff = DateTime.fromISO(item.date).toLocal().diff(DateTime.local());
  console.log(diff.as('days'));

  let str = `Scheduled for ${formattedDate}`;
  if (diff.as('days') < 1) str = `${str} (in ${diff.toFormat('hh:mm:ss')})`

  return { diff, str };
};

const Student = () => {
  const { courseCreatorProvider, course } = useSelector(selectedCourseSelectors.select);
  const selectedItem = useSelector(selectedCourseSelectors.selectSelectedItem);
  const adminTokens = useSelector(selectedCourseSelectors.selectAdminTokens);
  const dispatch = useDispatch();
  const [update, setUpdate] = useState(0);

  const { str } = getDateTime({ course, item: selectedItem });
  const providerId = courseCreatorProvider?.id;

  // TODO Figure out how to abstract this.
  useEffect(() => {
    let interval;
    const clear = () => clearInterval(interval);

    clear();
    if (selectedItem) interval = setInterval(() => setUpdate(value => value + 1), 1000)

    return clear;
  }, [selectedItem, setUpdate]);

  const onSchedule = async () => {
    console.log('onSchedule');
    dispatch(scheduleActions.openScheduler());
    // dispatch(scheduleActions.getServices());
  };

  const onJoin = () => {};

  return (
    <div className="mode-inner">
      <ItemInfo item={selectedItem} status={str} tokens={adminTokens} />
      {
        !!selectedItem.date
          ? <Button variant="contained" color="primary" onClick={onJoin} disabled={selectedItem.status !== 'live'}>
            Join
          </Button>
          : <Button variant="contained" color="primary" onClick={onSchedule}>
            Schedule
          </Button>
      }

      {providerId && false && (
        <Iframe
          id="schedule"
          // url={`http://localhost:8000?provider=${providerId}`}
          url={`${easy.url}/index.php/user/login?admin`}
          width="800px"
          height="900px"
          display="block"
          position="absolute"
          style={{ width: '900px', height: '50px', zIndex: 10 }}
        />
      )}
    </div>
  );
};

const Teacher = () => {
  const studentTokens = useSelector(selectedCourseSelectors.selectStudentTokens);
  const adminTokens = useSelector(selectedCourseSelectors.selectAdminTokens);
  const ownsCourse = useSelector(selectedCourseSelectors.selectOwnsCourse);
  const selectedItem = useSelector(selectedCourseSelectors.selectSelectedItem);
  const { course } = useSelector(selectedCourseSelectors.select);
  const { isOpen } = useSelector(uiSelectors2.editItem.select);
  const dispatch = useDispatch();
  const [update, setUpdate] = useState(0);

  const { str, diff } = getDateTime({ course, item: selectedItem });
  const tokens = ownsCourse ? studentTokens : adminTokens;

  // TODO Figure out how to extract this.
  useEffect(() => {
    let interval;
    const clear = () => clearInterval(interval);

    clear();
    if (selectedItem?.date) interval = setInterval(() => setUpdate(value => value + 1), 1000)

    return clear;
  }, [selectedItem, setUpdate]);

  const canLaunch = () => {
    return course.type !== 'template' // Can't launch a template.
      && !!selectedItem.date // Can't launch unscheduled.
      && (diff && diff.as('minutes') < 10) // Can't launch if more than 10 minutes away.
  };

  return (
    <>
      {
        isOpen
          ? <EditItemView/>
          : (
            <>
              <div className="mode-inner">
                <ItemInfo tokens={tokens} status={str} item={selectedItem} />
                {course.type !== 'template' && (
                  <Button
                    color="primary" variant="contained"
                    onClick={() => dispatch(
                      catalogActions.launchItem({ courseUid: course.uid, itemUid: selectedItem.uid })
                    )}
                    disabled={false}
                  >
                    Go Live
                  </Button>
                )}
              </div>
              <div className="owner-controls">
                <div className="spacer" />
                <Button
                  variant="contained"
                  onClick={() => dispatch(uiActions2.editItem.open())}
                >
                  Edit
                </Button>
              </div>
            </>
          )
      }
    </>
  );
};

const ScheduledMode = () => {
  const ownsCourse = useSelector(selectedCourseSelectors.selectOwnsCourse);

  return (
    <div className="item-mode scheduled-mode">
      {
        ownsCourse
          ? <Teacher/>
          : <Student/>
      }
    </div>
  );
};

export default ScheduledMode;
