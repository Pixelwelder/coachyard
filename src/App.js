import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import logo from './logo.svg';
import { Counter } from './features/counter/Counter';
import Video from './features/video';
import './App.css';
import { actions as appActions } from './features/app/appSlice';

function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(appActions.init());
  }, [dispatch]);

  return (
    <div className="App">
      <header className="App-header">
        {/*<img src={logo} className="App-logo" alt="logo" />*/}
        <Counter />
        <Video />
      </header>
    </div>
  );
}

export default App;
