import React from 'react';
import Button from '@material-ui/core/Button';
import { actions as uiActions } from '../ui/uiSlice';
import { useDispatch, useSelector } from 'react-redux';
import { selectors as catalogSelectors, actions as catalogActions } from './catalogSlice';
import { selectors as uiSelectors } from '../ui/uiSlice';
import CatalogItem from './CatalogItem';

const CatalogList = ({ title, onCreate, onDelete, items }) => {
  return (
    <div className="catalog-list">
      <div className="catalog-list-title">
        <p>{ title }</p>
        {onCreate && (
          <Button onClick={onCreate}>
            Create
          </Button>
        )}
      </div>
      <ul>
        {items.map((item, index) => <CatalogItem item={item} key={index} onDelete={onDelete} />)}
      </ul>
    </div>
  );
};

const TeachingCatalogList = () => {
  const courses = useSelector(catalogSelectors.selectTeachingCourses);
  const { newCourseDialog, deleteDialog } = useSelector(uiSelectors.select);
  const dispatch = useDispatch();

  return (
    <CatalogList
      title="Teaching"
      onCreate={() => dispatch(uiActions.setUI({ newCourseDialog: { ...newCourseDialog, open: true } }))}
      onDelete={(item) => dispatch(uiActions.setUI({
        deleteDialog: {
          ...deleteDialog,
          open: true,
          item,
          onConfirm: catalogActions.deleteCourse
        }
      }))}
      items={courses}
    />
  );
};

const LearningCatalogList = () => {
  return <CatalogList title="Learning" items={[]} />;
};

export { TeachingCatalogList, LearningCatalogList };
