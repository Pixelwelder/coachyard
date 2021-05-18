import React from 'react';
import { selectors as scheduleSelectors, actions as scheduleActions } from './scheduleSlice';
import './schedule.scss';
import { useDispatch, useSelector } from 'react-redux';
import Button from '@material-ui/core/Button';

const Schedule = () => {
  const dispatch = useDispatch();
  const { tab, isLoading } = useSelector(scheduleSelectors.select);

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
      {/* <Tabs */}
      {/*  value={tab} */}
      {/*  onChange={(event, newValue) => dispatch(scheduleActions.setTab(newValue))} */}
      {/* > */}
      {/*  <Tab label="Calendar" /> */}
      {/*  <Tab label="Availability" /> */}
      {/*  /!*<Tab label="Breaks" />*!/ */}
      {/*  /!*<Tab label="Exceptions" />*!/ */}
      {/* </Tabs> */}

      {/* {tab === TABS.CALENDAR && <Calendar />} */}
      {/* {tab === TABS.WORKING_PLAN && <WorkingPlan />} */}
    </div>
  );
};

export default Schedule;
