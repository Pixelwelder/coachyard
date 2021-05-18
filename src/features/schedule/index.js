import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '@material-ui/core/Button';
import { selectors as scheduleSelectors, actions as scheduleActions } from './scheduleSlice';
import './schedule.scss';

const Schedule = () => {
  const dispatch = useDispatch();
  const { isLoading } = useSelector(scheduleSelectors.select);

  return (
    <div className="schedule">
      <Button
        onClick={() => {
          dispatch(scheduleActions.openCalendar());
        }}
        variant="contained"
        color="primary"
        disabled={isLoading}
      >
        Open Calendar
      </Button>
    </div>
  );
};

export default Schedule;
