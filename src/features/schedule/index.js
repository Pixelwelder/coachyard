import React, { useReducer, useEffect } from 'react';
import { selectors as scheduleSelectors, actions as scheduleActions, TABS } from './scheduleSlice';
import './schedule.scss';
import Calendar from './Calendar';
import { useDispatch, useSelector } from 'react-redux';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import WorkingPlan from './WorkingPlan';
import Button from '@material-ui/core/Button';

const Schedule = () => {
  const dispatch = useDispatch();
  const { tab } = useSelector(scheduleSelectors.select);

  return (
    <div className="schedule">
      <Button
        onClick={() => {
          dispatch(scheduleActions.openCalendar());
        }}
        variant="contained"
        color="primary"
      >
        Open Calendar
      </Button>
      {/*<Tabs*/}
      {/*  value={tab}*/}
      {/*  onChange={(event, newValue) => dispatch(scheduleActions.setTab(newValue))}*/}
      {/*>*/}
      {/*  <Tab label="Calendar" />*/}
      {/*  <Tab label="Availability" />*/}
      {/*  /!*<Tab label="Breaks" />*!/*/}
      {/*  /!*<Tab label="Exceptions" />*!/*/}
      {/*</Tabs>*/}

      {/*{tab === TABS.CALENDAR && <Calendar />}*/}
      {/*{tab === TABS.WORKING_PLAN && <WorkingPlan />}*/}
    </div>
  );
};

export default Schedule;