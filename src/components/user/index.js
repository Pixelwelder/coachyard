import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import app from 'firebase/app';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Button from '@material-ui/core/Button';

import { actions as userActions, selectors as userSelectors } from '../../features/app/userSlice';
import { actions as uiActions2 } from '../../features/ui/uiSlice2';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import './user.scss';

const Auth = () => {
  const { isSignedIn, image } = useSelector(userSelectors.select);
  const dispatch = useDispatch();
  const authUser = app.auth().currentUser;

  // Menu
  const [anchorEl, setAnchorEl] = useState(null);

  const onOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const onClose = () => {
    setAnchorEl(null);
  };

  const onLogOut = () => {
    onClose();
    dispatch(userActions.signOut());
  }

  const onShowAccount = () => {
    onClose();
    dispatch(uiActions2.account.open());
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
                    {image && (
                      <img
                        className="header-user-image"
                        src={image}
                      />
                    )}
                    <span className="user-name">{authUser.displayName || authUser.email}</span>
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
