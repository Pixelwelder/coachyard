import Typography from '@material-ui/core/Typography';
import ReactHtmlParser from 'react-html-parser';
import Button from '@material-ui/core/Button';
import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import EditIcon from '@material-ui/icons/Edit';
import CancelIcon from '@material-ui/icons/Cancel';
import CheckIcon from '@material-ui/icons/Check';
import WysiwygEditor from '../../../components/WysiwygEditor';
import { selectors as selectedCourseSelectors } from '../selectedCourseSlice';
import { actions as catalogActions } from '../../catalog/catalogSlice';

const ItemDescription = ({ selectedItem, ownsItem }) => {
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');

  const canSubmit = useCallback(() => {
    return editedDescription !== selectedItem.description;
  }, [selectedItem, editedDescription]);

  const onEdit = () => {
    setIsEditing(true);
    setEditedDescription(selectedItem.description);
  };

  const onStopEdit = () => {
    setIsEditing(false);
    setEditedDescription('');
  };

  const onChangeDescription = (description) => {
    setEditedDescription(description);
  };

  const { course, selectedItemUid } = useSelector(selectedCourseSelectors.select);
  const onSubmit = async () => {
    try {
      await dispatch(catalogActions.updateItem({
        courseUid: course.uid, itemUid: selectedItemUid, update: { description: editedDescription }
      }));
      onStopEdit();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="item-description">
      {isEditing && (
        <WysiwygEditor
          value={editedDescription}
          onChange={onChangeDescription}
        />
      )}
      {!isEditing && (
        <>
          { ReactHtmlParser(selectedItem?.description || '') }
          <div className="spacer" />
        </>
      )}
      {ownsItem && (
        <>
          <div className="owner-controls">
            <div className="spacer" />
            {!isEditing && (
              <Button
                variant="contained"
                onClick={onEdit}
              >
                <EditIcon fontSize="small" />
              </Button>
            )}
            {isEditing && (
              <>
                <Button
                  size="small" variant="contained" color="primary"
                  onClick={onSubmit}
                  disabled={!canSubmit()}
                >
                  <CheckIcon fontSize="small" />
                </Button>
                <Button
                  variant="contained"
                  onClick={onStopEdit}
                >
                  <CancelIcon fontSize="small" />
                </Button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ItemDescription;
