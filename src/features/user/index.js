import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FormControl from '@material-ui/core/FormControl';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Button from '@material-ui/core/Button';
import Input from '@material-ui/core/Input';

import { selectors as appSelectors, actions as appActions } from '../app/appSlice';
import { actions as uiActions } from '../ui/uiSlice';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import './user.scss';

const Auth = () => {
  const { authUser, isLoading } = useSelector(appSelectors.select);
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
      {!!authUser.uid && (
        <div className="auth-form">
          <Button
            onClick={onOpen}
          >
            <span className="user-image"></span>
            <span className="user-name">{authUser.displayName || authUser.email}</span>
            <ArrowDropDownIcon />
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
          {/*<span className="email">{authUser.email}</span>*/}
          {/*<Button disabled={isLoading} onClick={onLogOut} variant="outlined">Sign Out</Button>*/}
        </div>
      )}
      {/*{!authUser.uid && (*/}
      {/*  <form className="auth-form" onSubmit={onLogIn}>*/}
      {/*    <FormControl>*/}
      {/*      <Input*/}
      {/*        id="email" value={email} disabled={isLoading} placeholder="email"*/}
      {/*        onChange={({ target: { value } }) => setEmail(value)}*/}
      {/*      />*/}
      {/*    </FormControl>*/}
      {/*    <FormControl>*/}
      {/*      <Input*/}
      {/*        id="password" type="password" value={password} disabled={isLoading} placeholder="password"*/}
      {/*        onChange={({ target: { value }}) => setPassword(value)}*/}
      {/*      />*/}
      {/*    </FormControl>*/}
      {/*    /!*<FormControl disabled={isLoading} value={email} as="input" onChange={({ target: { value } }) => setEmail(value)}/>*!/*/}
      {/*    /!*<FormControl disabled={isLoading} value={password} as="input" type="password" onChange={({ target: { value }}) => setPassword(value)} />*!/*/}
      {/*    <Button type="submit" disabled={isLoading} variant="outlined">Sign In</Button>*/}
      {/*  </form>*/}
      {/*)}*/}
    </div>
  );
};

export default Auth;
