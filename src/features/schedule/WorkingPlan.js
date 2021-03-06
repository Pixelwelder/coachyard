import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectors as scheduleSelectors, actions as scheduleActions } from './scheduleSlice';
import Alert from '@material-ui/lab/Alert';
import Button from '@material-ui/core/Button';
import ReloadIcon from '@material-ui/icons/Cached';
import Typography from '@material-ui/core/Typography';
import EditIcon from '@material-ui/icons/Edit';
import DoneIcon from '@material-ui/icons/Done';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/HighlightOff';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import { TimePicker } from '@material-ui/pickers';
import DateTime from 'luxon/src/datetime';
import { listTimes, to12Hour } from '../../util/times';
import { selectors as userSelectors } from '../app/userSlice';

const Header = () => {
  return (
    <div className="working-plan-header">
      <Typography className="working-day-header-item">Day</Typography>
      <Typography className="working-day-header-item">Start</Typography>
      <Typography className="working-day-header-item">End</Typography>
      <Typography className="working-day-header-item">Breaks</Typography>
      <Typography className="working-day-header-item"></Typography>
    </div>
  );
}

const Period = ({ name, start, end, onChange, onRemove }) => {
  return (
    <div className="day-period">
      <Typography>{name}</Typography>
      <TimePicker
        minutesStep={15}
        value={toComponentTime(start)}
        onChange={(value) => console.log('value', toServerTime(value))}
      />
      {end && (
        <>
          <p>to</p>
          <TimePicker minutesStep={15} value={toComponentTime(end)} onChange={() => {}} />
        </>
      )}

      {onRemove && (
        <Button onClick={onRemove}>
          <RemoveIcon />
        </Button>
      )}
    </div>
  );
}

const toDisplayTime = timeString => {
  const [hour, minute] = timeString.split(':');
  return DateTime.fromObject({ hour, minute, zone: 'utc' }).toLocal().toLocaleString(DateTime.TIME_SIMPLE);
};
const toComponentTime = timeString => {
  const [hour, minute] = timeString.split(':');
  return DateTime.fromObject({ hour, minute, zone: 'utc' }).toLocal().toString();
}
const toServerTime = dateTime => {
  return dateTime.toUTC().toLocaleString(DateTime.TIME_24_SIMPLE);
};

const Day = ({ day }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localDay, setLocalDay] = useState(null);
  const { error } = useSelector(scheduleSelectors.select);

  useEffect(() => {
    setLocalDay(day);
  }, [day])

  if (!localDay) return null;

  const onChange = ({ target: { name, value } }) => {
    console.log('onChange', name, value);
    setLocalDay({
      ...localDay,

    })
  };

  const onAdd = () => {
    // localDay.breaks.push({ })
  }

  const onRemove = () => {

  }

  const onSave = () => {
    // Collect and save.
    setIsOpen(false);
  }

  return (
    <li className="working-plan-day">
      <div className="working-plan-day-closed">
        <Typography className="working-day-name">
          {localDay.name}
        </Typography>

        <Typography className="working-day-start">
          {toDisplayTime(localDay.start)}
        </Typography>

        <Typography className="working-day-end">
          {toDisplayTime(localDay.end)}
        </Typography>

        <Typography className="working-day-breaks">
          {localDay.breaks.length}
        </Typography>

        <div className="working-day-actions">
          {isOpen
            ? (
              <Button onClick={onSave}>
                <DoneIcon />
              </Button>
            )
            : (
              <Button onClick={() => setIsOpen(true)}>
                <EditIcon />
              </Button>
            )
          }
        </div>
      </div>

      {isOpen && (
        <div className="working-plan-day-open">
          <Period name="Start" start={localDay.start} onChangeStart={onChange} />

          {/*{localDay.breaks.map((b, index) => {*/}
          {/*  return (*/}
          {/*    <Period*/}
          {/*      name="Break"*/}
          {/*      start={b.start}*/}
          {/*      end={b.end}*/}
          {/*      onChangeStart={() => {}}*/}
          {/*      onChangeEnd={() => {}}*/}
          {/*      onRemove={onRemove}*/}
          {/*    />*/}
          {/*  );*/}
          {/*})}*/}

          {/*<Button onClick={onAdd}>*/}
          {/*  <AddIcon />*/}
          {/*</Button>*/}

          <Period name="End" start={localDay.end} />
          {!!error && <Alert severity="error">{error.message}</Alert>}

          {/*<Time name="End" value={"11:45 PM"} />*/}
        </div>
      )}
    </li>
  );
};

const WorkingPlanList = ({ provider, workingPlan }) => {

  return (
    <>
      <Header />
      <ul className="working-plan-list">
        {workingPlan.map((day, index) => <Day day={day} key={index} />)}
      </ul>
    </>
  );
}

const WorkingPlan = () => {
  const dispatch = useDispatch();
  const { provider, isLoading, error } = useSelector(scheduleSelectors.select);
  const workingPlan = useSelector(scheduleSelectors.selectWorkingPlan);
  const { isSignedIn } = useSelector(userSelectors.select)

  const onLoad = () => {
    dispatch(scheduleActions.getProvider());
  }

  useEffect(() => {
    if (isSignedIn) onLoad();
  }, [isSignedIn]);

  return (
    <div className="working-plan">
      <Button
        disabled={isLoading}
        onClick={onLoad}
      >
        <ReloadIcon />
      </Button>
      {isLoading && <p>Loading...</p>}
      {!!error && <Alert severity="error">{error.message}</Alert>}
      {!isLoading && <WorkingPlanList provider={provider} workingPlan={workingPlan} />}
    </div>
  );
};

export default WorkingPlan;
