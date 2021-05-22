import React from 'react';
import { useSelector } from 'react-redux';
import CircularProgress from '@material-ui/core/CircularProgress';
import { NavLink } from 'react-router-dom';
import { selectors as appSelectors } from '../features/app/appSlice';

const Footer = () => {
  const { globalIsInitialized, globalIsLoading } = useSelector(appSelectors.select);

  return (
    <div className="footer">
      <ul className="footer-list">
        <NavLink to={'/terms-and-conditions'}>Terms and Conditions</NavLink>
        <NavLink to={'/privacy-policy'}>Privacy Policy</NavLink>
      </ul>
      <div className="spacer" />
      <div className="status-indicator">
        {globalIsLoading && <CircularProgress size={15} />}
      </div>
    </div>
  );
};

export default Footer;
