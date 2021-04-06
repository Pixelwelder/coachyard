import React from 'react';
import { useSelector } from 'react-redux';
import { selectors as appSelectors } from '../features/app/appSlice';
import CircularProgress from '@material-ui/core/CircularProgress';
import StatusIcon from '@material-ui/icons/FiberManualRecord';

const Footer = () => {
  const { globalIsInitialized, globalIsLoading } = useSelector(appSelectors.select);

  return (
    <div className="footer">
      <ul className="footer-list">
        <li>Terms and Conditions</li>
        <li>Privacy</li>
      </ul>
      <div className="spacer" />
      <div className="status-indicator">
        {globalIsLoading && <CircularProgress size={15}/>}
      </div>
    </div>
  )
};

export default Footer;
