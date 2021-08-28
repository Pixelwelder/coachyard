import React, { useRef, useState } from 'react';
import Typography from '@material-ui/core/Typography';
import { useSelector } from 'react-redux';
import { selectors as selectedCourseSelectors, actions as selectedCourseActions } from '../selectedCourseSlice';
import AddIcon from '@material-ui/icons/Add';
import Button from '@material-ui/core/Button';
import Attachment from './Attachment';
import UploadAttachmentDialog from '../../../components/UploadAttachmentDialog';

const Attachments = () => {
  const { attachments } = useSelector(selectedCourseSelectors.select);
  const ownsCourse = useSelector(selectedCourseSelectors.selectOwnsCourse);
  const selectedItem = useSelector(selectedCourseSelectors.selectSelectedItem);
  const [upload, setUpload] = useState('');
  const [editing, setEditing] = useState(-1);

  console.log('attachments', attachments)

  const onChange = ({ target }) => {
    const { value } = target;
    const name = target.getAttribute('name');
    // dispatch(actions.setValues({ [name]: value }));
  };

  return (
    <div className="attachments">
      <UploadAttachmentDialog
        type={upload}
        filename={attachments.length}
        onClose={() => setUpload('')}
      />
      {!!attachments.length && (
        <ul className="attachment-list">
          {
            attachments.map((attachment, index) => (
              <Attachment
                key={index}
                attachment={attachment}
                onEdit={() => setEditing(index)}
                onStopEdit={() => setEditing(-1)}
                isEditing={editing === index}
              />
            ))
          }
        </ul>
      )}
      {!attachments.length && (
        <Typography>This item has no attachments.</Typography>
      )}
      {ownsCourse && (
        <Button
          variant="contained" color="primary" size="small"onClick={() => setUpload('attachments')}
        >
          <AddIcon />
        </Button>
      )}
    </div>
  );
};

export default Attachments;
