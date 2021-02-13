import React, { useState } from 'react';
import app from 'firebase/app';
import { useDispatch, useSelector } from 'react-redux';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import StorageImage from '../../components/StorageImage';
import { selectors as selectedCourseSelectors, actions as selectedCourseActions } from '../course/selectedCourseSlice';
import './chat.scss';

const ChatMessage = ({ message }) => {
  const authUser = app.auth().currentUser;
  const { text, sender, photoURL } = message;
  const messageClass = sender === authUser.uid ? 'sent' : 'received';

  return (
    <div className={`chat-message ${messageClass}`}>
      <StorageImage url={`/avatars/${sender}.png`} className="chat-avatar" />
      <p>{text}</p>
    </div>
  )
};

const Chat = ({ messages }) => {
  const { chatMessage } = useSelector(selectedCourseSelectors.select);
  const dispatch = useDispatch();

  const onChange = (value) => {
    dispatch(selectedCourseActions.setChatMessage(value));
  };

  const onSubmit = async (event) => {
    console.log('onSubmit');
    event.preventDefault();
    console.log(selectedCourseActions.submitChatMessage);
    await dispatch(selectedCourseActions.submitChatMessage());
    console.log('submitted');
  };

  return (
    <div className="chat">
      <div className="main">
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message}/>
        ))}
      </div>
      <form className="chat-form" onSubmit={onSubmit}>
        <TextField
          size="small"
          className="chat-input"
          variant="outlined"
          placeholder="Send message"
          value={chatMessage}
          onChange={({ target: { value } }) => onChange(value)}
        />
        <Button variant="contained" color="primary" type="submit" onClick={onSubmit}>Submit</Button>
      </form>
    </div>
  );
};

const CourseChat = () => {
  const { chat } = useSelector(selectedCourseSelectors.select);
  return <Chat messages={chat} />
}

export { CourseChat };
