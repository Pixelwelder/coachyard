import React from 'react';
import Button from '@material-ui/core/Button';
import { actions as uiActions } from '../ui/uiSlice';
import { useDispatch, useSelector } from 'react-redux';
import { selectors as catalogSelectors, actions as catalogActions } from './catalogSlice';
import { selectors as coachSelectors } from '../coach/coachSlice';
import { actions as uiActions2 } from '../ui/uiSlice2';
import Typography from '@material-ui/core/Typography';
import CatalogItem from './CatalogItem';
import { selectors as billingSelectors2 } from '../billing2/billingSlice2';
import { useHistory } from 'react-router-dom';

const CatalogList = ({
  title, onCreate, onDelete, items, emptyMessage
}) => {
  const history = useHistory();

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
                    history.push(`/course/${item.courseUid || item.uid}`);
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
  const courses = useSelector(catalogSelectors.selectTeachingTokens);
  const dispatch = useDispatch();
  const { tier } = useSelector(billingSelectors2.select);
  const history = useHistory();

  const onCreate = () => {
    if (tier) {
      dispatch(uiActions2.createCourse.open())
    } else {
      history.push('/billing');
    }
  };

  return (
    <CatalogList
      title="Teaching"
      onCreate={onCreate}
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
  const courses = useSelector(catalogSelectors.selectLearningTokens);

  return (
    <CatalogList
      title="Learning"
      items={courses}
      emptyMessage="You are not learning anything yet."
    />
  );
};

const PublicCatalogList = () => {
  const { coach } = useSelector(coachSelectors.select);
  const courses = useSelector(coachSelectors.selectPublicCourses);

  return (
    <CatalogList
      title="Public Courses"
      items={courses}
      emptyMessage={`${coach?.displayName || 'This coach'} has no public courses.`}
    />
  );
};

const TemplateCatalogList = () => {
  const { coach } = useSelector(coachSelectors.select);
  const courses = useSelector(coachSelectors.selectTemplateCourses);

  return (
    <CatalogList
      title="Template Courses"
      items={courses}
      emptyMessage={`${coach?.displayName || 'This coach'} has no template courses.`}
    />
  );
};

export { TeachingCatalogList, LearningCatalogList, PublicCatalogList, TemplateCatalogList };
