import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Button from '@material-ui/core/Button';

import { actions as appActions } from '../../features/app/appSlice';
import { selectors as userSelectors } from '../../features/app/userSlice';
import { actions as uiActions } from '../../features/ui/uiSlice';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import './user.scss';

const Auth = () => {
  const { isSignedIn, meta } = useSelector(userSelectors.select);
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Menu
  const [anchorEl, setAnchorEl] = useState(null);

  const onOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const onClose = () => {
    setAnchorEl(null);
  };

  const onLogIn = (event) => {
    event.preventDefault();
    dispatch(appActions.signIn({ email, password }));
  };

  const onLogOut = () => {
    onClose();
    dispatch(appActions.signOut());
  }

  const onShowAccount = () => {
    onClose();
    dispatch(uiActions.setShowAccount(true));
  };

  return (
    <div className="component auth-status">
      <div className="auth-form">

          <>
            <Button
              onClick={onOpen}
              disabled={!isSignedIn}
            >
              {isSignedIn
                ? (
                  <>
                    <span className="user-image"></span>
                    <span className="user-name">{meta.displayName || meta.email}</span>
                    <ArrowDropDownIcon />
                  </>
                )
                : (
                  <span className="user-name">No user</span>
                )
              }
            </Button>
            <Menu
              id="simple-menu"
              anchorEl={anchorEl}
              keepMounted
              open={!!anchorEl}
              onClose={onClose}
            >
              <MenuItem onClick={onShowAccount}>Account</MenuItem>
              <MenuItem onClick={onLogOut}>Logout</MenuItem>
            </Menu>
          </>
      </div>
    </div>
  );
};

export default Auth;
