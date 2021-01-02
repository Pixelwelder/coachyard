import React from 'react';
import Button from '@material-ui/core/Button';
import { actions as uiActions } from '../ui/uiSlice';
import MODES from '../ui/Modes';
import { useDispatch, useSelector } from 'react-redux';
import { selectors as catalogSelectors, actions as catalogActions } from './catalogSlice';
import { actions as uiActions2 } from '../ui/uiSlice2';
import { selectors as uiSelectors } from '../ui/uiSlice';
import Typography from '@material-ui/core/Typography';
import CatalogItem from './CatalogItem';
import makeStyles from '@material-ui/core/styles/makeStyles';
import { useHistory } from 'react-router-dom';

const CatalogList = ({
  title, onCreate, onDelete, items, emptyMessage
}) => {
  const history = useHistory();

  if (!emptyMessage && !items.length) return null;

  return (
    <div className="catalog-list-container">
      <div className="title-container">
        <Typography variant="h5" component="h2" className="title">{title}</Typography>
        {onCreate && (
          <Button onClick={onCreate} variant="outlined" size="small">
            Create New
          </Button>
        )}
      </div>
      {
        items.length
          ? (
            <ul className="catalog-list">
              {items.map((item, index) => (
                <CatalogItem
                  item={item}
                  key={index}
                  onSelect={() => {
                    history.push(`/course/${item.uid}`);
                  }}
                  onDelete={onDelete}
                />
              ))}
            </ul>
          )
          : (
            <div className="catalog-list-placeholder">
              <Typography className="empty-message">{emptyMessage}</Typography>
            </div>
          )
      }
    </div>
  );
};

const TeachingCatalogList = () => {
  const { courses } = useSelector(catalogSelectors.selectTeaching);
  const dispatch = useDispatch();

  return (
    <CatalogList
      title="Teaching"
      onCreate={() => dispatch(uiActions2.createCourse.open())}
      onDelete={(item) => dispatch(uiActions.openDialog({
        name: 'deleteDialog',
        params: {
          item,
          onConfirm: catalogActions.deleteCourse
        }
      }))}
      items={courses}
      emptyMessage="You have not created any courses yet."
    />
  );
};

const LearningCatalogList = () => {
  const { courses } = useSelector(catalogSelectors.selectLearning);
  console.log('COURSES', courses);

  return (
    <CatalogList
      title="Learning"
      items={courses}
    />
  );
};

export { TeachingCatalogList, LearningCatalogList };
