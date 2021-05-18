import React, { useEffect, useRef, useState } from 'react';
import app from 'firebase/app';
import { useDispatch, useSelector } from 'react-redux';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { selectors as selectedCourseSelectors, actions as selectedCourseActions } from '../course/selectedCourseSlice';
import { selectors as assetsSelectors, actions as assetsActions } from '../assets/assetsSlice';
import { actions as uiActions2 } from '../ui/uiSlice2';
import { actions as dashboardActions } from '../dashboard/dashboardSlice';
import './chat.scss';
import { selectHasAccessToCurrentCourse } from '../app/comboSelectors';

const EMPTY_MESSAGES = {
  LOCKED: 'Please purchase this course to unlock chat with this coach.',
  NO_COURSE: 'No course selected.',
};

const ChatMessage = ({ message }) => {
  const { images } = useSelector(assetsSelectors.select);
  const dispatch = useDispatch();
  const authUser = app.auth().currentUser;
  const { text, sender } = message;
  const path = `/avatars/${sender}.png`;
  const { [path]: imageUrl } = images;
  const messageClass = sender === authUser.uid ? 'sent' : 'received';

  useEffect(() => {
    if (!imageUrl) {
      dispatch(assetsActions.getAsset({ path }));
    }
  }, [imageUrl, path]);

  return (
    <li className={`chat-message ${messageClass}`}>
      <img src={imageUrl} className="chat-avatar" />
      <p>{text}</p>
    </li>
  );
};

const Chat = ({
  messages, hasAccess, courseUid, emptyMessage = EMPTY_MESSAGES.LOCKED,
}) => {
  const dispatch = useDispatch();
  const dummy = useRef();
  const [message, setMessage] = useState('');

  const onChange = (value) => {
    // dispatch(selectedCourseActions.setChatMessage(value));
    setMessage(value);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    await dispatch(selectedCourseActions.submitChatMessage({ courseUid, message }));
    setMessage('');
  };

  const onClear = async () => {
    // const result = await dispatch(getConfirmation());
    dispatch(uiActions2.confirmAction.open({
      onConfirm: () => {
        dispatch(dashboardActions.clearChat());
      },
    }));
  };

  const isDisabled = !hasAccess || !courseUid;

  useEffect(() => {
    console.log('SCROLL');
    if (dummy.current) {
      dummy.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [dummy, messages]);

  return (
    <>
      <Button onClick={onClear} disabled={isDisabled || !messages.length}>Clear</Button>
      {hasAccess && !!courseUid
        ? (
          <ul className="chat-main">
            {messages.map((message, index) => (
              <ChatMessage key={index} message={message} />
            ))}
            <span ref={dummy} />
          </ul>
        )
        : (
          <div className="chat-main chat-main-locked">
            <Typography>{emptyMessage}</Typography>
          </div>
        )}
      <form className="chat-form" onSubmit={onSubmit}>
        <TextField
          size="small"
          className="chat-input"
          variant="outlined"
          placeholder="Send message"
          value={message}
          onChange={({ target: { value } }) => onChange(value)}
          disabled={isDisabled}
        />
        <Button
          variant="contained"
          color="primary"
          type="submit"
          onClick={onSubmit}
          disabled={isDisabled}
        >
          Submit
        </Button>
      </form>
    </>
  );
};

const BaseChat = ({ chat, courseUid }) => <Chat messages={chat} courseUid={courseUid} hasAccess emptyMessage={EMPTY_MESSAGES.NO_COURSE} />;

const CourseChat = () => {
  const chat = useSelector(selectedCourseSelectors.selectChat);
  const hasAccess = useSelector(selectHasAccessToCurrentCourse);
  const { course: { uid } } = useSelector(selectedCourseSelectors.select);
  return <Chat messages={chat} courseUid={uid} hasAccess={hasAccess} />;
};

export { CourseChat, BaseChat };
