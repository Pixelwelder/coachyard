import React, { useState } from 'react';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import EditIcon from '@material-ui/icons/Edit';
import CancelIcon from '@material-ui/icons/Cancel';
import CheckIcon from '@material-ui/icons/Check';
import TextField from '@material-ui/core/TextField';

const ItemTitle = ({ item, onSubmit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayName, setDisplayName] = useState('');

  const onEdit = () => {
    setDisplayName(item.displayName);
    setIsEditing(true);
  };

  const onStopEdit = () => {
    setDisplayName('');
    setIsEditing(false);
  };

  const onCommit = async () => {
    setIsSubmitting(true);
    await onSubmit(displayName);
    setIsSubmitting(false);
    setIsEditing(false);
  };

  const onChange = ({ target: { value } }) => {
    setDisplayName(value);
  };

  return (
    <div className={`item-title-container${isEditing ? ' is-editing' : ''}`}>
      {item && (
        <>
          {!isEditing && (
            <>
              <Typography className="item-view-title" variant="h6">{item.displayName}</Typography>
              <Button onClick={onEdit}>
                <EditIcon color="action" />
              </Button>
            </>
          )}
          {isEditing && (
            <>
              <TextField
                autoFocus
                onFocus={event => {
                  event.target.select();
                }}
                onKeyDown={({ keyCode }) => {
                  if (keyCode === 13) onCommit();
                }}
                variant="outlined"
                size="small"
                id="displayName"
                name="displayName"
                label="Item Name"
                type="text"
                value={displayName}
                onChange={onChange}
                disabled={isSubmitting}
              />
              <Button onClick={onCommit} color="primary" variant="contained" size="small" disabled={isSubmitting}>
                <CheckIcon />
              </Button>
              <Button onClick={onStopEdit} variant="contained" size="small" disabled={isSubmitting}>
                <CancelIcon />
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ItemTitle;
