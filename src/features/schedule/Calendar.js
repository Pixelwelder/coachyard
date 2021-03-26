import React from 'react';
import Iframe from 'react-iframe';
import { url } from '../../__config__/easy.json';

const Calendar = () => {
  return (
    <div className="calendar">
      <Iframe
        id="schedule"
        // url={`http://localhost:8000?provider=${providerId}`}
        url={`${url}/index.php/user/login?admin`}
        width="800px"
        height="500px"
        display="block"
        position="absolute"
        style={{ width: '900px', height: '50px', zIndex: 10 }}
      />
    </div>
  );
};

export default Calendar;
