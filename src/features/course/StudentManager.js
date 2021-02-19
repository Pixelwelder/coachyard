import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import DeleteIcon from '@material-ui/icons/Delete';
import MemberIcon from '@material-ui/icons/CheckCircle';
import {
  selectors as selectedCourseSelectors, actions as selectedCourseActions, STUDENT_MANAGER_MODE
} from './selectedCourseSlice';

const tokenIsUnclaimed = token => token.user === token.userDisplayName;

const StudentView = ({ token }) => {
  const dispatch = useDispatch();

  const onDelete = () => {
    dispatch(selectedCourseActions.setTokenToRemove(token));
    dispatch(selectedCourseActions.setStudentManagerMode(STUDENT_MANAGER_MODE.DELETE));
  }

  const onEdit = () => {
    dispatch(selectedCourseActions.setStudentManagerMode(STUDENT_MANAGER_MODE.EDIT_INVITE));
  }

  return (
    <div className="student-view">
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

const EmailResult = ({ result }) => {
  if (!result) return null;

  return (
    <>
      {typeof result === 'string' && (<p>Not found: {result}</p>)}
      {typeof result === 'object' && (<p>{result.displayName}</p>)}
    </>
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
      <div className="student-manager-content">
        <form className="student-search-form">
          <TextField
            value={email}
            onChange={({ target: { value } }) => setEmail(value)}
            onSubmit={onSearch}
            label="Email Address"
            placeholder="student@email.com"
            autoFocus
          />
          <Button type="submit" onClick={onSearch} variant="contained" disabled={!email}>Search</Button>
        </form>
      </div>

      <div className="student-manager-controls">
        <Button
          variant="outlined"
          onClick={() => {
            dispatch(selectedCourseActions.setStudentManagerMode(STUDENT_MANAGER_MODE.LIST));
          }}
        >
          Back
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
    dispatch(selectedCourseActions.removeUser(user));
  }

  const onCancel = () => {
    dispatch(selectedCourseActions.resetTokenToRemove());
    dispatch(selectedCourseActions.setStudentManagerMode(STUDENT_MANAGER_MODE.LIST));
  }

  return (
    <div className="student-manager-page student-delete">
      <div className="student-manager-content">
        <p>{`Delete ${tokenToRemove?.userDisplayName}?`}</p>
      </div>
      <div className="student-manager-controls">
        <Button onClick={onCancel}>Back</Button>
        <Button onClick={onRemove}>Confirm</Button>
      </div>
    </div>
  )
};

const ViewUser = () => {
  const { emailResult } = useSelector(selectedCourseSelectors.select);
  const dispatch = useDispatch();

  const onCancel = () => {

  }

  const onChange = () => {
    dispatch(selectedCourseActions.setStudentManagerMode(STUDENT_MANAGER_MODE.ADD));
  }

  const onSubmit = () => {
    dispatch(selectedCourseActions.addUser());
  }

  return (
    <div className="student-manager-page student-add">
      <div className="student-manager-content">
        <div className="student-result-form">
          <EmailResult result={emailResult} />
        </div>
        <Button onClick={onChange}>Change</Button>
      </div>
      <div className="student-manager-controls">
        <Button onClick={onCancel}>Back</Button>
        <Button onClick={onSubmit}>Confirm</Button>
      </div>
    </div>
  );
};

const EditInvite = () => {
  const dispatch = useDispatch();

  return (
    <div className="student-manager-page student-edit-invite">
      <div className="student-manager-content">
        <p>Content</p>
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
  const dispatch = useDispatch();

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
