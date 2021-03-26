import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectors as dashboardSelectors, actions as dashboardActions } from '../dashboardSlice';
import { selectors as assetsSelectors } from '../../assets/assetsSlice';
import Typography from '@material-ui/core/Typography';
import Badge from '@material-ui/core/Badge';
import { BaseChat } from '../../chat';

const ChatTitle = ({ course, isSelected, onClick }) => {
  const { displayName, numChats, numChatsUnseen } = course;

  return (
    <li onClick={onClick} className={`chat-title${isSelected ? ' selected' : ''}`}>
      <Badge badgeContent={numChats} color="primary">
        <Typography>
          {displayName}
        </Typography>
      </Badge>
    </li>
  )
}

const Chats = () => {
  const { courses, selectedChat, selectedChatUid } = useSelector(dashboardSelectors.select);
  const dispatch = useDispatch();

  const onClick = (course) => {
    console.log('onClick', course.uid);
    dispatch(dashboardActions.setSelectedChat(course));
  };

  return (
    <div className="chats">
      <ul className="chats-list">
        {
          courses.map((course, index) => (
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
        <BaseChat chat={selectedChat} courseUid={selectedChatUid} />
      </div>
    </div>
  )
};

export default Chats;
