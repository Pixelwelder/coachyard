import React from 'react';
import { DateTime, Duration } from 'luxon';
import Typography from '@material-ui/core/Typography';
import LockIcon from '@material-ui/icons/Lock';
import { useSelector } from 'react-redux';
import { selectHasAccessToCurrentCourse } from '../app/comboSelectors';

const getDurationString = (seconds) => {
  // const d = Duration.fromMillis(seconds * 1000);
  // console.log('getDurationString', seconds, d.hours, d.minutes, d.seconds);
  // let str = '';
  // if (d.hours) str = `${d.hours}h`;
  // if (d.minutes || d.hours) str = `${str} ${d.minutes}m`;
  // str = `${str} ${d.seconds}s`;
  // console.log('getDurationString results', str);
  //
  // return str.trim();

  return seconds
    ? Duration.fromMillis(seconds * 1000).toFormat('hh:mm:ss')
    : '-';
}

const Item = ({ item, isSelected, onSelect }) => {
  const formattedTime = DateTime.fromISO(item.date).toLocal().toLocaleString(DateTime.DATETIME_SHORT);
  const timeRemaining = DateTime.fromISO(item.date).toLocal().diff(DateTime.local()).toFormat('h:mm');
  const duration = getDurationString(item?.streamingInfo?.data?.duration || 0);
  const hasAccess = useSelector(selectHasAccessToCurrentCourse);

  return (
    <li className={`item item${isSelected ? ' selected-item' : ''} item-${item.status}`}>
      <span
        onClick={onSelect}
        className="item-title"
      >
        <Typography className="item-name">
          <>
            {item.displayName}
            {!hasAccess && <LockIcon className="item-name-icon" color="disabled" />}
          </>
        </Typography>
        {item.status === 'scheduled' && (
          <Typography>{formattedTime} (in {timeRemaining})</Typography>
        )}
        {item.status === 'live' && (
          <Typography>Now live</Typography>
        )}
        {item.status === 'processing' && (
          <Typography>Processing</Typography>
        )}
        {/* TODO Time would be super cool. */}
        {item.status === 'viewing' && (
          <Typography>{duration}</Typography>
        )}
      </span>
    </li>
  )
};

export default Item;
