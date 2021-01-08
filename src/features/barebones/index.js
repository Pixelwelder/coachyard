import React, { useEffect } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import DailyIframe from '@daily-co/daily-js';
import queryString from 'query-string';
import Button from '@material-ui/core/Button';
import BackIcon from '@material-ui/icons/ArrowBack';
// import BackIcon from '@material-ui/icons/CallEnd';
import { useDispatch, useSelector } from 'react-redux';
import { selectors as selectedCourseSelectors, actions as selectedCourseActions } from '../course/selectedCourseSlice';

const Barebones = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();
  const query = queryString.parse(location.search);
  const { id = '' } = query;

  const { isRecording } = useSelector(selectedCourseSelectors.select);

  useEffect(() => {
    const callFrame = DailyIframe.createFrame({
      // iframeStyle: {
      //   position: 'absolute',
      //   width: '100vw',
      //   height: '100vh',
      //   top: 0,
      //   left: 0,
      // }
    });
    callFrame.on('recording-started', () => {
      dispatch(selectedCourseActions.setIsRecording(true));
    });
    callFrame.on('recording-stopped', () => dispatch(selectedCourseActions.setIsRecording(false)));
    callFrame.join({ url: `https://coachyard.daily.co/${id}` });
  }, []);
  return (
    <div className="barebones">
      <h3>BareBones</h3>
      <Button
        variant="contained"
        color="secondary"
        onClick={() => {
          if (isRecording) {
            alert('Please stop recording before navigating away.');
          } else {
            history.goBack();
          }
        }}
      >
        <BackIcon />
      </Button>
    </div>
  );
};

export default Barebones;
