import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Typography from '@material-ui/core/Typography';
import Catalog from '../catalog';
import './dashboard.scss';
import { actions as dashboardActions, selectors as dashboardSelectors, TABS } from './dashboardSlice';
import { selectors as catalogSelectors } from '../catalog/catalogSlice';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Schedule from '../schedule';
import Students from './students';
import Chats from './chats';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { tab } = useSelector(dashboardSelectors.select);
  const isTeacher = useSelector(catalogSelectors.selectIsTeacher);

  return (
    <div className="dashboard">
      <Typography variant="h2" component="h2">Dashboard</Typography>
      <Tabs
        variant="fullWidth"
        value={tab}
        onChange={(event, newValue) => dispatch(dashboardActions.setTab(newValue))}
      >
        <Tab label="Courses" />
        {isTeacher && <Tab label="Students"/>}
        {isTeacher && <Tab label="Chats"/>}
        <Tab label="Schedule" />
      </Tabs>
      <div className="dashboard-content">
        {tab === TABS.COURSES && <Catalog />}
        {tab === TABS.SCHEDULE && <Schedule />}
        {tab === TABS.STUDENTS && <Students />}
        {tab === TABS.CHATS && <Chats />}
      </div>
    </div>
  )
};

export default Dashboard;
