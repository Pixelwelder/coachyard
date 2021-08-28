import React, { useRef, useState } from 'react';
import Typography from '@material-ui/core/Typography';
import { useSelector } from 'react-redux';
import { selectors as selectedCourseSelectors, actions as selectedCourseActions } from '../selectedCourseSlice';
import AddIcon from '@material-ui/icons/Add';
import Button from '@material-ui/core/Button';
import Attachment from './Attachment';

const Attachments = () => {
  const { attachments } = useSelector(selectedCourseSelectors.select);
  const ownsCourse = useSelector(selectedCourseSelectors.selectOwnsCourse);
  const [isEditing, setIsEditing] = useState(-1);
  const [isCreating, setIsCreating] = useState(null);

  const onCreate = () => {
    setIsCreating(true);
    setIsEditing(true);
  };

  return (
    <div className="attachments">
      <ul className="attachment-list">
        {!attachments.length && !isCreating && (
          <li className="no-attachments">
            <Typography>This item has no attachments.</Typography>
          </li>
        )}
        {
          attachments.map((attachment, index) => (
            <Attachment
              key={index}
              attachment={attachment}
              onEdit={() => setIsEditing(index)}
              onStopEdit={() => setIsEditing(-1)}
              isEditing={isEditing === index}
            />
          ))
        }
        {
          isCreating && (
            <Attachment
              attachment={null}
              onStopEdit={() => setIsCreating(false)}
              isEditing
            />
          )
        }
        {ownsCourse && !isCreating && (
          <li className="add-attachment-btn">
            <Button
              variant="contained" color="default" size="small"onClick={onCreate}
            >
              <AddIcon />
            </Button>
          </li>
        )}
      </ul>
    </div>
  );
};

export default Attachments;
