import React, { useEffect, useRef, useState } from 'react';
import app from 'firebase/app';
import { useDispatch, useSelector } from 'react-redux';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import StorageImage from '../../components/StorageImage';
import { selectors as selectedCourseSelectors, actions as selectedCourseActions } from '../course/selectedCourseSlice';
import './chat.scss';
import { selectHasAccessToCurrentCourse } from '../app/comboSelectors';
import Typography from '@material-ui/core/Typography';

const ChatMessage = ({ message, imageUrls }) => {
  const authUser = app.auth().currentUser;
  const { text, sender } = message;
  const imageUrl = imageUrls[sender];
  const messageClass = sender === authUser.uid ? 'sent' : 'received';

  return (
    <li className={`chat-message ${messageClass}`}>
      <img src={imageUrl} className="chat-avatar" />
      <p>{text}</p>
    </li>
  )
};

const Chat = ({ messages }) => {
  const { chatMessage, imageUrls } = useSelector(selectedCourseSelectors.select);
  const dispatch = useDispatch();
  const hasAccess = useSelector(selectHasAccessToCurrentCourse);
  const dummy = useRef();

  const onChange = (value) => {
    dispatch(selectedCourseActions.setChatMessage(value));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    await dispatch(selectedCourseActions.submitChatMessage());
  };

  useEffect(() => {
    if (dummy.current) {
      dummy.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [dummy, messages])

  return (
    <>
      {hasAccess
        ? (
          <ul className="chat-main">
            {messages.map((message, index) => (
              <ChatMessage key={index} message={message} imageUrls={imageUrls}/>
            ))}
            <span ref={dummy}></span>
          </ul>
        )
        : (
          <div className="chat-main chat-main-locked">
            <Typography>Please purchase this course to unlock chat.</Typography>
          </div>
        )
      }
      <form className="chat-form" onSubmit={onSubmit}>
        <TextField
          size="small"
          className="chat-input"
          variant="outlined"
          placeholder="Send message"
          value={chatMessage}
          onChange={({ target: { value } }) => onChange(value)}
          disabled={!hasAccess}
        />
        <Button variant="contained" color="primary" type="submit" onClick={onSubmit} disabled={!hasAccess}>
          Submit
        </Button>
      </form>
    </>
  );
};

const CourseChat = () => {
  const { chat } = useSelector(selectedCourseSelectors.select);
  return <Chat messages={chat} />
}

export { CourseChat };
