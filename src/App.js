import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import Video from './features/video';
import Log from './features/log';
import './App.scss';
import { actions as appActions } from './features/app/appSlice';

function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(appActions.init());
  }, [dispatch]);

  return (
    <div className="App">
      <div className="page-section header">
        <h1>Header</h1>
      </div>
      <div className="page-section body">
        <div className="sidebar sidebar-1">
          <h2>Sidebar 1</h2>
        </div>
        <div className="video">
          <h2>Video</h2>
          <Video />
        </div>
        <div className="sidebar sidebar-2">
          <h2>Sidebar 2</h2>
          <Log />
        </div>
      </div>

      <div className="page-section footer">
        <h2>Footer</h2>
      </div>

    </div>
  );
}

export default App;
