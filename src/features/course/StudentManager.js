import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import DeleteIcon from '@material-ui/icons/Delete';
import {
  selectors as selectedCourseSelectors, actions as selectedCourseActions, STUDENT_MANAGER_MODE
} from './selectedCourseSlice';

const StudentView = ({ token }) => {
  const dispatch = useDispatch();

  const onDelete = () => {
    dispatch(selectedCourseActions.setTokenToRemove(token));
    dispatch(selectedCourseActions.setStudentManagerMode(STUDENT_MANAGER_MODE.DELETE));
  }

  return (
    <div className="student-view">
      <p className="student-name">{token.userDisplayName}</p>
      <Button onClick={onDelete}>
        <DeleteIcon />
      </Button>
    </div>
  );
};

const StudentManager = () => {
  const { studentManagerMode } = useSelector(selectedCourseSelectors.select);
  const dispatch = useDispatch();

  const onNavigate = (page) => {
    dispatch(selectedCourseActions.setStudentManagerMode(page));
  }

  const List = () => {
    const tokens = useSelector(selectedCourseSelectors.selectStudentTokens);

    const onAdd = () => {
      dispatch(selectedCourseActions.setStudentManagerMode(STUDENT_MANAGER_MODE.ADD));
    }

    return (
      <div className="student-manager-page student-list">
        <ul>
          {tokens.map((token, index) => (
            <StudentView key={index} token={token} />
          ))}
        </ul>
        <Button
          variant="outlined"
          className="student-list-add"
          onClick={onAdd}
        >
          Add
        </Button>
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

  const Add = ({ onNavigate }) => {
    const { emailResult } = useSelector(selectedCourseSelectors.select);
    const dispatch = useDispatch();
    const [email, setEmail] = useState('');

    const onSearch = (event) => {
      event.preventDefault();
      dispatch(selectedCourseActions.searchForEmail({ email }));
    };

    const onChange = () => {
      dispatch(selectedCourseActions.resetEmailResult());
    }

    const onAdd = () => {
      dispatch(selectedCourseActions.addUser())
    }

    return (
      <div className="student-manager-page student-add">
        {emailResult && (
          <div className="student-result-form">
            <EmailResult result={emailResult} />
            <Button onClick={onChange}>Change</Button>
            <Button onClick={onAdd}>Add Person</Button>
          </div>
        )}

        {!emailResult && (
          <form className="student-search-form">
            <TextField
              value={email}
              onChange={({ target: { value } }) => setEmail(value)}
              onSubmit={onSearch}
              label="Email Address"
              placeholder="student@email.com"
            />
            <Button type="submit" onClick={onSearch} variant="contained" disabled={!email}>Search</Button>
          </form>
        )}
        <div className="student-controls">
          <Button className="student-cancel" variant="outlined" onClick={() => onNavigate(STUDENT_MANAGER_MODE.LIST)}>Back</Button>
          {/*<Button className="student-confirm" variant="contained" color="primary" onClick={() => {}}>Confirm</Button>*/}
        </div>
      </div>
    )
  };

  const Delete = ({ onNavigate, user }) => {
    const { tokenToRemove } = useSelector(selectedCourseSelectors.select);

    const onRemove = () => {
      dispatch(selectedCourseActions.removeUser(user));
    }

    const onCancel = () => {
      dispatch(selectedCourseActions.resetTokenToRemove());
      onNavigate(STUDENT_MANAGER_MODE.LIST);
    }

    return (
      <div className="student-manager-page student-delete">
        <p>{`Delete ${tokenToRemove?.userDisplayName}?`}</p>
        <Button className="student-cancel" onClick={onCancel}>Back</Button>
        <Button className="student-confirm" onClick={onRemove}>Confirm</Button>
      </div>
    )
  };

  return (
    <div className="student-manager">
      {studentManagerMode === 0 && (
        <List />
      )}

      {studentManagerMode === 1 && (
        <Add onNavigate={onNavigate} />
      )}
      {studentManagerMode === 2 && (
        <Delete onNavigate={onNavigate} />
      )}
    </div>
  );
};

export default StudentManager;
