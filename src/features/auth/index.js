import React, { useState } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { Form, Button } from "react-bootstrap";

import { selectors as firebaseSelectors, actions as firebaseActions } from "../store/slices/firebase";

const Auth = () => {
  const { authUser, isLoading } = useSelector(firebaseSelectors.select);
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onLogIn = (event) => {
    event.preventDefault();
    dispatch(firebaseActions.signIn({ email, password }));
  };

  const onLogOut = () => {
    dispatch(firebaseActions.signOut());
  }

  return (
    <div className="component auth-status">
      {authUser && (
        <div className="auth-form">
          <p className="email">{authUser.email}</p>
          <Button disabled={isLoading} size="sm" onClick={onLogOut}>Sign Out</Button>
        </div>
      )}
      {!authUser && (
        <Form className="auth-form" onSubmit={onLogIn}>
          <Form.Control disabled={isLoading} value={email} as="input" onChange={({ target: { value } }) => setEmail(value)}/>
          <Form.Control disabled={isLoading} value={password} as="input" type="password" onChange={({ target: { value }}) => setPassword(value)} />
          <Button type="submit" disabled={isLoading} size="sm">Sign In</Button>
        </Form>
      )}
    </div>
  );
};

export default Auth;
