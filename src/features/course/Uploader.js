import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import app from 'firebase/app';

export const Uploader = ({ onChange, disabled }) => {
  const fileInputRef = useRef(null);
  const [accountLimited, setAccountLimited] = useState(false);
  const [remaining, setRemaining] = useState(0);

  const onTargetClick = () => {
    fileInputRef.current.click();
  }

  useEffect(() => {
    const go = async () => {
      const authUser = app.auth().currentUser;
      const { claims: { remaining = 0 } } = await authUser.getIdTokenResult(true);
      // if (remaining <= 0) setAccountLimited(true);
      setRemaining(Math.floor(remaining));
    }
    go();
  }, [])

  const isDisabled = () => {
    return disabled || accountLimited;
  }

  return (
    <div className="uploader-container">
      <input className="upload-input" ref={fileInputRef} type="file" onChange={onChange} disabled={isDisabled()}/>
      {/*{accountLimited*/}
      {/*  ? (*/}
      {/*    <>*/}
      {/*      <p className="account-warning">You have reached the limits of your account.</p>*/}
      {/*      <Link to="/billing">Upgrade here</Link>.*/}
      {/*    </>*/}
      {/*  )*/}
      {/*  : (*/}
      {/*    <p className="account-info">You have {remaining} video minutes remaining on your account.</p>*/}
      {/*  )*/}
      {/*}*/}
    </div>
  );
};
