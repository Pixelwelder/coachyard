import React, { useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { actions as coachActions, selectors as coachSelectors } from './coachSlice';
import { actions as uiActions2, selectors as uiSelectors2 } from '../ui/uiSlice2';
import { useDispatch, useSelector } from 'react-redux';
import { PublicCatalogList, TemplateCatalogList, BaseCatalogList } from '../catalog/CatalogList';
import Alert from '@material-ui/lab/Alert';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

const Coach = () => {
  const history = useHistory();
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { isLoading, error, coach, courses } = useSelector(coachSelectors.select);
  const products = useSelector(coachSelectors.selectTemplateTokens);
  const update = useSelector(uiSelectors2.editCoach.select);
  const { isOpen, description } = update;

  useEffect(() => {
    dispatch(coachActions.load({ slug, history }));
  }, [slug, history, dispatch]);

  const onEdit = () => {
    dispatch(uiActions2.editCoach.open({
      description: coach.description
    }));
  };

  const onCancel = () => {
    dispatch(uiActions2.editCoach.reset());
  };

  const onChange = ({ target }) => {
    const { value } = target;
    const name = target.getAttribute('name');
    dispatch(uiActions2.editCoach.setValues({ [name]: value }));
  };

  const onSave = async () => {
    dispatch(coachActions.update(update));
  };

  if (!coach) return null;
  return (
    <div className="coach-page">
      <Typography variant="h1">{coach.displayName}</Typography>
      {/*TODO*/}
      {isOpen
        ? (
          <TextField
            value={description} onChange={onChange} name="description" variant="outlined" multiline rows="4"
          />
        )
        : (<Typography style={{ marginBottom: 32 }}>{coach?.description || ''}</Typography>)
      }
      {isLoading && <p>Loading...</p>}
      {!!error && <Alert severity="error">{error.message}</Alert>}
      {/*<PublicCatalogList />*/}
      <BaseCatalogList title="Products" items={products} />
      {/*{courses.map((course, index) => {*/}
      {/*  return <p key={index}>{course.displayName}</p>*/}
      {/*})}*/}
      <div className="spacer" />

      <div className="coach-edit-controls">
        {!isOpen && (
          <Button className="coach-edit-button" onClick={onEdit} disabled={isLoading} variant="contained">
            Edit
          </Button>
        )}

        {isOpen && (
          <>
            <Button
              className="coach-cancel-button" onClick={onCancel} variant="contained" color="default"
            >
              Cancel
            </Button>
            <Button
              className="coach-save-button" onClick={onSave} disabled={isLoading} variant="contained" color="primary"
            >
              Save
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default Coach;
