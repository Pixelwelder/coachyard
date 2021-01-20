import { useDispatch, useSelector } from 'react-redux';
import { selectors as selectedCourseSelectors } from './selectedCourseSlice';
import { selectors as uiSelectors2 } from '../ui/uiSlice2';
import { DateTime } from 'luxon';
import { EditView } from './EditView';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import { actions as catalogActions } from '../catalog/catalogSlice';
import React from 'react';

export const ScheduledMode = () => {
  const ownsCourse = useSelector(selectedCourseSelectors.selectOwnsCourse);
  const item = useSelector(selectedCourseSelectors.selectSelectedItem);
  const { course, student, selectedItem, courseCreator, courseCreatorImageUrl } = useSelector(selectedCourseSelectors.select);
  const { isOpen } = useSelector(uiSelectors2.editItem.select);
  const dispatch = useDispatch();

  const formattedDate = DateTime.fromISO(item.date).toLocal().toLocaleString(DateTime.DATETIME_SHORT);
  const timeRemaining = DateTime.fromISO(item.date).toLocal().diff(DateTime.local())
    .toFormat('h:mm');

  const Teacher = () => {
    return (
      <>
        <div className="mode-inner">
          {
            isOpen
              ? <EditView/>
              : (
                <>
                  <div className="centered-mode">
                    <div className="item-info">
                      <img className="item-info-image" src={courseCreatorImageUrl}/>
                      <Typography className="participant-name" variant="h6" component="p">
                        {selectedItem.displayName}
                      </Typography>
                      <Typography className="meeting-date">Scheduled for {formattedDate} (in {timeRemaining})</Typography>
                    </div>
                    <Button
                      color="primary" variant="contained"
                      onClick={() => dispatch(catalogActions.launchItem(item))}
                    >
                      Launch
                    </Button>
                  </div>
                  {/*<div className="owner-controls">*/}
                  {/*  <Button variant="contained" onClick={() => {}}>*/}
                  {/*    Edit*/}
                  {/*  </Button>*/}
                  {/*</div>*/}
                </>
              )
          }
        </div>
      </>

    );
  };

  const Student = () => {
    return (
      <div className="mode-inner">
        <div className="item-info">
          <Typography>Waiting for</Typography>
          <img className="item-info-image" src={courseCreatorImageUrl}/>
          <Typography className="participant-name" variant="h6" component="p">
            {courseCreator?.displayName}
          </Typography>
          <Typography className="meeting-date">Scheduled for {formattedDate} (in {timeRemaining})</Typography>
        </div>
      </div>
    );
  };

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
