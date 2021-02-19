import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import DeleteIcon from '@material-ui/icons/Delete';
import NonUserIcon from '@material-ui/icons/Help';
import {
  selectors as selectedCourseSelectors, actions as selectedCourseActions, STUDENT_MANAGER_MODE
} from './selectedCourseSlice';
import app from 'firebase/app';
import Typography from '@material-ui/core/Typography';

const tokenIsUnclaimed = token => token.user === token.userDisplayName;

const StudentView = ({ token }) => {
  const { imageUrls } = useSelector(selectedCourseSelectors.select);
  const dispatch = useDispatch();

  const imageUrl = imageUrls[token.user];

  const onDelete = () => {
    dispatch(selectedCourseActions.setCurrentToken(token));
    dispatch(selectedCourseActions.setStudentManagerMode(STUDENT_MANAGER_MODE.DELETE));
  }

  const onEdit = () => {
    dispatch(selectedCourseActions.setStudentManagerMode(STUDENT_MANAGER_MODE.EDIT_INVITE));
  }

  return (
    <div className="student-view">
      {imageUrl
        ? <img className="student-view-thumb" src={imageUrl} />
        : (
          <div className="student-view-thumb no-student">
            <NonUserIcon />
          </div>
        )
      }
      <p className="student-name">{token.userDisplayName}</p>
      {tokenIsUnclaimed(token) && (
        <Button onClick={onEdit}>
          Invite...
        </Button>
      )}
      <Button onClick={onDelete}>
        <DeleteIcon />
      </Button>
    </div>
  );
};

const List = () => {
  const tokens = useSelector(selectedCourseSelectors.selectStudentTokens);
  const dispatch = useDispatch();

  const onAdd = () => {
    dispatch(selectedCourseActions.setStudentManagerMode(STUDENT_MANAGER_MODE.ADD));
  }

  return (
    <div className="student-manager-page student-list">
      <Typography variant="h6">Who has access to this course?</Typography>
      <div className="student-manager-content">
        <ul>
          {tokens.map((token, index) => (
            <StudentView key={index} token={token} />
          ))}
        </ul>
      </div>
      <div className="student-manager-controls">
        <div className="spacer" />
        <Button
          variant="outlined"
          className="student-list-add"
          onClick={onAdd}
        >
          Add
        </Button>
      </div>
    </div>
  );
};

const Add = () => {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');

  const onSearch = (event) => {
    event.preventDefault();
    dispatch(selectedCourseActions.searchForEmail({ email }));
  };

  return (
    <div className="student-manager-page student-add">
      <Typography variant="h6">Add Student</Typography>
      <div className="student-manager-content">
        <form className="student-search-form">
          <TextField
            value={email}
            onChange={({ target: { value } }) => setEmail(value)}
            onSubmit={onSearch}
            label="Email Address"
            placeholder="student@email.com"
            variant="outlined"
            autoFocus
          />
          <Button type="submit" onClick={onSearch} variant="contained" color="primary" disabled={!email}>
            Search
          </Button>
        </form>
      </div>

      <div className="student-manager-controls">
        <Button
          variant="outlined"
          onClick={() => {
            dispatch(selectedCourseActions.setStudentManagerMode(STUDENT_MANAGER_MODE.LIST));
          }}
        >
          Cancel
        </Button>
        {/*<Button className="student-confirm" variant="contained" color="primary" onClick={() => {}}>Confirm</Button>*/}
      </div>
    </div>
  )
};

const Delete = ({ user }) => {
  const { tokenToRemove } = useSelector(selectedCourseSelectors.select);
  const dispatch = useDispatch();

  const onRemove = () => {
    dispatch(selectedCourseActions.removeUser());
  }

  const onCancel = () => {
    dispatch(selectedCourseActions.resetCurrentToken());
    dispatch(selectedCourseActions.setStudentManagerMode(STUDENT_MANAGER_MODE.LIST));
  }

  return (
    <div className="student-manager-page student-delete">
      <Typography variant="h6">Remove Student</Typography>
      <div className="student-manager-content">
        <_UserView user={tokenToRemove} propName="userDisplayName" />
        <p>{`This course will no longer be available to ${tokenToRemove?.userDisplayName}. Proceed?`}</p>
      </div>
      <div className="student-manager-controls">
        <Button onClick={onCancel}>Back</Button>
        <Button onClick={onRemove}>Confirm</Button>
      </div>
    </div>
  )
};

const _UserView = ({ user, propName = 'displayName' }) => {
  const isUser = () => (user !== null) && (typeof user === 'object');
  const getName = () => isUser() ? user[propName] : user;

  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    const getImageUrl = async () => {
      const { image } = user;
      const url = await app.storage().ref(`/avatars/${image}`).getDownloadURL();
      setImageUrl(url);
    }

    if (isUser()) getImageUrl();

  }, [user]);

  return (
    <div className="_user-view">
      {imageUrl
        ? (
          <img className="student-manager-image" src={imageUrl} />
        )
        : (
          <div className="student-manager-image student-manager-image-placeholder">
            <NonUserIcon />
          </div>
        )
      }
      <Typography className="student-manager-user-name" variant="h5">
        {getName()}
      </Typography>
      {!isUser() && (
        <Typography>This person is not a current Coachyard user.</Typography>
      )}
    </div>
  );
}

const ViewUser = () => {
  const { emailResult } = useSelector(selectedCourseSelectors.select);
  const dispatch = useDispatch();

  const onCancel = () => {
    dispatch(selectedCourseActions.setStudentManagerMode(STUDENT_MANAGER_MODE.ADD));
  }

  const onSubmit = () => {
    dispatch(selectedCourseActions.addUser());
  }

  return (
    <div className="student-manager-page view-user">
      <Typography variant="h6">Add Student</Typography>
      <div className="student-manager-content">
        <_UserView user={emailResult} />
      </div>
      <div className="student-manager-controls">
        <Button onClick={onCancel} variant="outlined">Back</Button>
        <Button onClick={onSubmit} variant="contained" color="primary">Add</Button>
      </div>
    </div>
  );
};

const EditInvite = () => {
  const dispatch = useDispatch();

  return (
    <div className="student-manager-page student-edit-invite">
      <div className="student-manager-content">
        {/*<_UserView />*/}
      </div>
      <div className="student-manager-controls">
        <Button
          onClick={() => {
            dispatch(selectedCourseActions.setStudentManagerMode(STUDENT_MANAGER_MODE.LIST));
          }}
        >
          Back
        </Button>
      </div>
    </div>
  );
}

const StudentManager = () => {
  const { studentManagerMode } = useSelector(selectedCourseSelectors.select);

  return (
    <div className="student-manager">
      {studentManagerMode === STUDENT_MANAGER_MODE.LIST && <List />}
      {studentManagerMode === STUDENT_MANAGER_MODE.ADD && <Add />}
      {studentManagerMode === STUDENT_MANAGER_MODE.DELETE && <Delete />}
      {studentManagerMode === STUDENT_MANAGER_MODE.VIEW_USER && <ViewUser />}
      {studentManagerMode === STUDENT_MANAGER_MODE.EDIT_INVITE && <EditInvite />}
    </div>
  );
};

export default StudentManager;
