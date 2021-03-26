import React, { useReducer, useEffect } from 'react';
import { selectors as scheduleSelectors, actions as scheduleActions, TABS } from './scheduleSlice';
import './schedule.scss';
import Calendar from './Calendar';
import { useDispatch, useSelector } from 'react-redux';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import WorkingPlan from './WorkingPlan';

const initialState = {
  isWriting: false,
  error: null
};

const reducer = (state, action) => {
  switch(action.type) {
    case 'setIsWriting': {
      return { ...state, isWriting: action.payload };
    }
    case 'setError': {
      return { ...state, error: action.payload };
    }
    default: {
      return state;
    }
  }
};

const writeValue = async ({ name, value }, { dispatch, state }) => {
  try {
    // Could place this throw outside catch if you want, or rethrow.
    if (state.isWriting) throw new Error('Already writing!');
    dispatch('setIsWriting', true);
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (error) {
    dispatch({ type: 'setError', payload: error });
  } finally {
    dispatch({ type: 'setIsWriting', payload: false });
  }
}

const Component = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { isWriting, error } = state;

  const onClick = async () => {
    await writeValue({ name: 'name', value: 'Jeff Van Houten' }, { dispatch, state });
    console.log('done');
  }

  return (
    <div>
      <h1>Component</h1>
      <button onClick={onClick}>Go</button>
      {isWriting && <p>Loading...</p>}
      {error && <p>{error.message}</p>}
    </div>
  );
}

const Schedule = () => {
  const dispatch = useDispatch();
  const { tab } = useSelector(scheduleSelectors.select);

  return (
    <div className="schedule">
      <Component />
      <Tabs
        value={tab}
        onChange={(event, newValue) => dispatch(scheduleActions.setTab(newValue))}
      >
        <Tab label="Calendar" />
        <Tab label="Availability" />
        {/*<Tab label="Breaks" />*/}
        {/*<Tab label="Exceptions" />*/}
      </Tabs>

      {tab === TABS.CALENDAR && <Calendar />}
      {tab === TABS.WORKING_PLAN && <WorkingPlan />}
    </div>
  );
};

export default Schedule;
