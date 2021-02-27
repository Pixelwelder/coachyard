import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Typography from '@material-ui/core/Typography';
import Catalog from '../catalog';
import './dashboard.scss';
import { actions as dashboardActions, selectors as dashboardSelectors, TABS } from './dashboardSlice';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Schedule from '../schedule';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { tab } = useSelector(dashboardSelectors.select);

  return (
    <div className="dashboard">
      <Typography variant="h2" component="h2">Dashboard</Typography>
      <Tabs variant="fullWidth"
        value={tab}
        onChange={(event, newValue) => dispatch(dashboardActions.setTab(newValue))}
      >
        <Tab label="Courses" />
        <Tab label="Students" disabled />
        <Tab label="Chats" disabled />
        <Tab label="Schedule" />
      </Tabs>
      <div className="dashboard-content">
        {tab === TABS.COURSES && <Catalog />}
        {tab === TABS.SCHEDULE && <Schedule />}
      </div>
    </div>
  )
};

export default Dashboard;
