import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import DeleteIcon from '@material-ui/icons/Delete';
import { selectors as selectedCourseSelectors, actions as selectedCourseActions } from './selectedCourseSlice';

const StudentView = ({ token, onDelete }) => {
  return (
    <div className="student-view">
      <p className="student-name">{token.userDisplayName}</p>
      <Button onClick={() => onDelete(token)}>
        <DeleteIcon />
      </Button>
    </div>
  );
};

const PAGES = {
  LIST: 0,
  ADD: 1,
  DELETE: 2
};

const StudentManager = () => {
  // TODO Currently we assume private.
  const [page, setPage] = useState(PAGES.LIST);

  const onNavigate = (page) => {
    setPage(page);
  }

  const List = ({ onAdd, onDelete }) => {
    const tokens = useSelector(selectedCourseSelectors.selectStudentTokens);

    return (
      <div className="student-manager-page student-list">
        <ul>
          {tokens.map((token, index) => (
            <StudentView key={index} token={token} onDelete={onDelete} />
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
        {typeof result === 'string' && (<p>{result}</p>)}
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

    return (
      <div className="student-manager-page student-add">
        {emailResult && (
          <>
            <EmailResult result={emailResult} />
            <Button onClick={onChange}>Change</Button>
          </>
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
            <Button type="submit" onClick={onSearch} variant="contained">Search</Button>
          </form>
        )}
        <div className="student-controls">
          <Button className="student-cancel" variant="outlined" onClick={() => onNavigate(PAGES.LIST)}>Back</Button>
          <Button className="student-confirm" variant="contained" color="primary" onClick={() => {}}>Confirm</Button>
        </div>
      </div>
    )
  };

  const Delete = ({ onNavigate }) => {
    return (
      <div className="student-manager-page student-delete">
        <Button className="student-cancel" onClick={() => onNavigate(PAGES.LIST)}>Back</Button>
      </div>
    )
  };

  return (
    <div className="student-manager">
      {page === 0 && (
        <List
          onAdd={() => {
            onNavigate(PAGES.ADD);
          }}
          onDelete={() => {
            onNavigate(PAGES.DELETE);
          }}
        />
      )}

      {page === 1 && (
        <Add onNavigate={onNavigate} />
      )}
      {page === 2 && (
        <Delete onNavigate={onNavigate} />
      )}
    </div>
  );
};

export default StudentManager;
