import { useDispatch, useSelector } from 'react-redux';
import { selectors as selectedCourseSelectors } from './selectedCourseSlice';
import { actions as uiActions2, selectors as uiSelectors2 } from '../ui/uiSlice2';
import { actions as scheduleActions, selectors as scheduleSelectors } from '../schedule/scheduleSlice';
import { DateTime } from 'luxon';
import EditItemView from './EditItemView';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import { actions as catalogActions } from '../catalog/catalogSlice';
import React from 'react';
import ParticipantList from '../../components/ParticipantList';
import Iframe from 'react-iframe';
import { url } from '../../__config__/easy.local.json';

const getDateTime = item => ({
  formattedDate: DateTime.fromISO(item.date).toLocal().toLocaleString(DateTime.DATETIME_SHORT),
  timeRemaining: DateTime.fromISO(item.date).toLocal().diff(DateTime.local()).toFormat('h:mm')
});

const BaseItem = () => {
  return (
    <div className="mode-inner">
      {/*{*/}
      {/*  isOpen*/}
      {/*    ? <EditItemView/>*/}
      {/*    : (*/}
      {/*      <>*/}
      {/*        <div className="centered-mode">*/}
      {/*          <div className="item-info">*/}
      {/*            <img className="item-info-image" src={courseCreatorImageUrl}/>*/}
      {/*            <Typography className="participant-name" variant="h6" component="p">*/}
      {/*              {selectedItem.displayName}*/}
      {/*            </Typography>*/}
      {/*            <Typography className="meeting-date">Scheduled for {formattedDate} (in {timeRemaining})</Typography>*/}
      {/*          </div>*/}
      {/*          <Button*/}
      {/*            color="primary" variant="contained"*/}
      {/*            onClick={() => dispatch(catalogActions.launchItem(item))}*/}
      {/*          >*/}
      {/*            Go Live*/}
      {/*          </Button>*/}
      {/*        </div>*/}
      {/*        <div className="owner-controls">*/}
      {/*          <Button*/}
      {/*            variant="contained"*/}
      {/*            onClick={() => dispatch(uiActions2.editItem.open())}*/}
      {/*          >*/}
      {/*            Edit*/}
      {/*          </Button>*/}
      {/*        </div>*/}
      {/*      </>*/}
      {/*    )*/}
      {/*}*/}
    </div>
  );
};

const Student = () => {
  const item = useSelector(selectedCourseSelectors.selectSelectedItem);
  const { courseCreator, courseCreatorProvider, courseCreatorImageUrl } = useSelector(selectedCourseSelectors.select);
  const dispatch = useDispatch();
  const { services } = useSelector(scheduleSelectors.select);

  const { formattedDate, timeRemaining } = getDateTime(item);
  const providerId = courseCreatorProvider?.id;

  const onSchedule = async () => {
    dispatch(scheduleActions.openScheduler());
    // dispatch(scheduleActions.getServices());
  };

  return (
    <div className="mode-inner">
      <div className="item-info">
        <Typography>Waiting for</Typography>
        <img className="item-info-image" src={courseCreatorImageUrl}/>
        <Typography className="participant-name" variant="h6" component="p">
          {courseCreator?.displayName}
        </Typography>
        <Typography className="meeting-date">Scheduled for {formattedDate} (in {timeRemaining})</Typography>
        <Button variant="contained" color="primary" onClick={onSchedule}>
          Schedule
        </Button>
      </div>

      {providerId && false && (
        <Iframe
          id="schedule"
          // url={`http://localhost:8000?provider=${providerId}`}
          url={`${url}/index.php/user/login?admin`}
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
  const item = useSelector(selectedCourseSelectors.selectSelectedItem);
  const studentTokens = useSelector(selectedCourseSelectors.selectStudentTokens);
  const adminTokens = useSelector(selectedCourseSelectors.selectAdminTokens);
  const ownsCourse = useSelector(selectedCourseSelectors.selectOwnsCourse);
  const { isOpen } = useSelector(uiSelectors2.editItem.select);
  const { selectedItem, courseCreatorImageUrl } = useSelector(selectedCourseSelectors.select);
  const dispatch = useDispatch();

  const { formattedDate, timeRemaining } = getDateTime(item);

  const tokens = ownsCourse ? studentTokens : adminTokens;
  return (
    <div className="mode-inner">
      {
        isOpen
          ? <EditItemView/>
          : (
            <>
              <div className="centered-mode">
                <div className="item-info">
                  <ParticipantList tokens={tokens} />
                  <Typography className="participant-name" variant="h6" component="p">
                    {selectedItem.displayName}
                  </Typography>
                  <Typography className="meeting-date">
                    {item.date !== null
                      ? <>Scheduled for {formattedDate} (in {timeRemaining})</>
                      : <>Unscheduled</>
                    }
                  </Typography>
                </div>
                <Button
                  color="primary" variant="contained"
                  onClick={() => dispatch(catalogActions.launchItem(item))}
                >
                  Go Live
                </Button>
              </div>
              <div className="owner-controls">
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
    </div>
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
