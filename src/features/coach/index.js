import React, { useEffect, useState } from 'react';
import app from 'firebase/app';
import { useParams, useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Avatar from '@material-ui/core/Avatar';
import EditIcon from '@material-ui/icons/Edit';
import { BaseCatalogList } from '../catalog/CatalogList';
import { actions as uiActions2, selectors as uiSelectors2 } from '../ui/uiSlice2';
import { actions as coachActions, selectors as coachSelectors } from './coachSlice';
import { actions as assetsActions, selectors as assetsSelectors } from '../assets/assetsSlice';
import UploaderDialog from '../../components/UploaderDialog';

const Coach = () => {
  const { images, dirtyFlags } = useSelector(assetsSelectors.select);
  const history = useHistory();
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { isLoading, coach } = useSelector(coachSelectors.select);
  const products = useSelector(coachSelectors.selectTokens);
  const update = useSelector(uiSelectors2.editCoach.select);
  const [upload, setUpload] = useState('');
  const { isOpen, description } = update;
  const isUser = coach?.uid === app.auth().currentUser?.uid;

  useEffect(() => {
    dispatch(coachActions.load({ slug, history }));
  }, [slug, history, dispatch]);

  const bannerPath = `/banners/${coach?.uid}`;
  const { [bannerPath]: bannerUrl } = images;
  const avatarPath = `/avatars/${coach?.uid}`;
  const { [avatarPath]: avatarUrl } = images;
  useEffect(() => {
    if (coach) {
      if (!bannerUrl) dispatch(assetsActions.getAsset({ path: bannerPath }));
      if (!avatarUrl) dispatch(assetsActions.getAsset({ path: avatarPath }));
    }
  }, [bannerUrl, bannerPath, avatarPath, avatarUrl, coach]);

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
      <UploaderDialog
        type={upload}
        filename={app.auth().currentUser?.uid}
        onClose={() => setUpload('')}
      />
      <div className="coach-banner" style={{ backgroundImage: `url("${bannerUrl}?m=${dirtyFlags[bannerPath]}")` }}>
        <div className="coach-avatar" style={{ backgroundImage: `url("${avatarUrl}?m=${dirtyFlags[avatarPath]}")` }}>
          {isOpen && (
            <Button variant="contained" size="small" onClick={() => setUpload('avatars')}>
              <EditIcon />
            </Button>
          )}
        </div>

        {isOpen && (
          <Button
            className="coach-banner-edit" variant="contained" size="small" onClick={() => setUpload('banners')}
          >
            <EditIcon />
          </Button>
        )}
      </div>
      <Typography variant="h4">{coach.displayName}</Typography>

      {/* TODO */}
      {isOpen
        ? (
          <TextField
            value={description}
            onChange={onChange}
            name="description"
            variant="outlined"
            multiline
            rows="4"
          />
        )
        : (<Typography style={{ marginBottom: 32 }}>{coach?.description || ''}</Typography>)}
      {isLoading && <p>Loading...</p>}
      {/* <PublicCatalogList /> */}
      <BaseCatalogList
        title="Products"
        items={products}
        emptyMessage={isUser ? 'You have no public products.' : 'This coach has no products.'}
      />
      {/* {courses.map((course, index) => { */}
      {/*  return <p key={index}>{course.displayName}</p> */}
      {/* })} */}
      <div className="spacer" />

      <div className="coach-edit-controls">
        {!isOpen && coach.uid === app.auth().currentUser?.uid && (
          <Button className="coach-edit-button" onClick={onEdit} disabled={isLoading} variant="contained">
            Edit
          </Button>
        )}

        {isOpen && (
          <>
            <Button
              className="coach-cancel-button"
              onClick={onCancel}
              variant="contained"
              color="default"
            >
              Cancel
            </Button>
            <Button
              className="coach-save-button"
              onClick={onSave}
              disabled={isLoading}
              variant="contained"
              color="primary"
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
