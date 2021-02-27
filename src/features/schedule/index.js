import React from 'react';
import Iframe from 'react-iframe';
import { selectors as scheduleSelectors, actions as scheduleActions } from './scheduleSlice';
import './schedule.scss';


const Schedule = () => {
  return (
    <div className="schedule">
      <Iframe
        id="schedule"
        // url={`http://localhost:8000?provider=${providerId}`}
        url={`http://localhost:8000/index.php/user/login`}
        width="800px"
        height="500px"
        display="block"
        position="absolute"
        style={{ width: '900px', height: '50px', zIndex: 10 }}
      />
    </div>
  );
};

export default Schedule;
