import React from 'react';
import Button from '@material-ui/core/Button';
import { actions as scheduleActions } from './scheduleSlice';
import { useDispatch } from 'react-redux';

const Calendar = () => {
  const dispatch = useDispatch();
  return (
    <div className="calendar">
      <Button
        onClick={() => {
          dispatch(scheduleActions.openCalendar());
        }}
        variant="contained"
        color="primary"
      >
        Open Calendar
      </Button>
      {/*<Iframe*/}
      {/*  id="schedule"*/}
      {/*  // url={`http://localhost:8000?provider=${providerId}`}*/}
      {/*  url={`${url}/index.php/user/login?admin`}*/}
      {/*  width="800px"*/}
      {/*  height="500px"*/}
      {/*  display="block"*/}
      {/*  position="absolute"*/}
      {/*  style={{ width: '900px', height: '50px', zIndex: 10 }}*/}
      {/*/>*/}
    </div>
  );
};

export default Calendar;
