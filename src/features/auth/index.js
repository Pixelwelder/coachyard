import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FormControl from '@material-ui/core/FormControl';
import Button from '@material-ui/core/Button';
import Input from '@material-ui/core/Input';

import { selectors as appSelectors, actions as appActions } from '../app/appSlice';

const Auth = () => {
  const { authUser, isLoading } = useSelector(appSelectors.select);
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onLogIn = (event) => {
    event.preventDefault();
    dispatch(appActions.signIn({ email, password }));
  };

  const onLogOut = () => {
    dispatch(appActions.signOut());
  }

  return (
    <div className="component auth-status">
      {!!authUser.uid && (
        <div className="auth-form">
          <span className="email">{authUser.email}</span>
          <Button disabled={isLoading} onClick={onLogOut} variant="outlined">Sign Out</Button>
        </div>
      )}
      {!authUser.uid && (
        <form className="auth-form" onSubmit={onLogIn}>
          <FormControl>
            <Input
              id="email" value={email} disabled={isLoading} placeholder="email"
              onChange={({ target: { value } }) => setEmail(value)}
            />
          </FormControl>
          <FormControl>
            <Input
              id="password" type="password" value={password} disabled={isLoading} placeholder="password"
              onChange={({ target: { value }}) => setPassword(value)}
            />
          </FormControl>
          {/*<FormControl disabled={isLoading} value={email} as="input" onChange={({ target: { value } }) => setEmail(value)}/>*/}
          {/*<FormControl disabled={isLoading} value={password} as="input" type="password" onChange={({ target: { value }}) => setPassword(value)} />*/}
          <Button type="submit" disabled={isLoading} variant="outlined">Sign In</Button>
        </form>
      )}
    </div>
  );
};

export default Auth;
