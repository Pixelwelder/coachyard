import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Chip from '@material-ui/core/Chip';
import { selectors as dashboardSelectors, actions as dashboardActions } from '../dashboardSlice';
import { BaseChat } from '../../chat';

const ChatTitle = ({ course, isSelected, onClick }) => {
  const { displayName, numChats, /* numChatsUnseen */ } = course;

  console.log(course);
  return (
    <li onClick={onClick}>
      <Paper className={`chat-title${isSelected ? ' selected' : ''}`} elevation={isSelected ? 5 : 0}>
        <Typography className="chat-title-text">
          {displayName}
        </Typography>
        <Chip label={numChats} color="primary" />
      </Paper>
    </li>
  );
};

const Chats = () => {
  const { selectedChat, selectedChatUid } = useSelector(dashboardSelectors.select);
  const chatCourses = useSelector(dashboardSelectors.selectNonTemplateCourses);
  const dispatch = useDispatch();

  const onClick = (course) => {
    dispatch(dashboardActions.setSelectedChat(course));
  };

  return (
    <div className="chats">
      <ul className="chats-list">
        {
          chatCourses.map((course, index) => (
            <ChatTitle
              key={index}
              course={course}
              isSelected={course.uid === selectedChatUid}
              onClick={() => onClick(course)}
            />
          ))
        }
      </ul>
      <div className="chat-container">
        <BaseChat chat={selectedChat} courseUid={selectedChatUid} showClear />
      </div>
    </div>
  );
};

export default Chats;
