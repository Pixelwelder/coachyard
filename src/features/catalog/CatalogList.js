import React from 'react';
import Button from '@material-ui/core/Button';
import { useDispatch, useSelector } from 'react-redux';
import Typography from '@material-ui/core/Typography';
import { useHistory } from 'react-router-dom';
import { actions as uiActions } from '../ui/uiSlice';
import { selectors as catalogSelectors, actions as catalogActions } from './catalogSlice';
import { selectors as coachSelectors } from '../coach/coachSlice';
import { actions as uiActions2 } from '../ui/uiSlice2';
import CatalogItem from './CatalogItem';
import { selectors as billingSelectors2 } from '../billing2/billingSlice2';

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

const requireBilling = false;
const ProductCatalogList = ({
  title = 'Teaching',
  emptyMessage = 'You have not created any courses yet.',
  courses,
  showCreate = false
}) => {
  const dispatch = useDispatch();
  const { tier } = useSelector(billingSelectors2.select);
  const history = useHistory();

  const onCreate = () => {
    if (requireBilling && !tier) {
      history.push('/billing');
    } else {
      dispatch(uiActions2.createCourse.open());
    }
  };

  return (
    <CatalogList
      title={title}
      onCreate={showCreate ? onCreate : null}
      onDelete={item => dispatch(uiActions.openDialog({
        name: 'deleteDialog',
        params: {
          item,
          onConfirm: catalogActions.deleteCourse
        }
      }))}
      items={courses}
      emptyMessage={emptyMessage}
    />
  );
};

const TemplateCatalogList = () => {
  const tokens = useSelector(coachSelectors.selectTemplateTokens);
  return <ProductCatalogList title="Products" courses={tokens} />;
};

const NonTemplateCatalogList = () => {
  const courses = useSelector(coachSelectors.selectNonTemplateTokens);
  return <ProductCatalogList title="Teaching" courses={courses} />;
};

const BaseCatalogList = ({
  items, title, emptyMessage, showCreate
}) => <ProductCatalogList title={title} courses={items} showCreate={showCreate} emptyMessage={emptyMessage} />;

const LearningCatalogList = ({ title = 'Learning' }) => {
  const courses = useSelector(catalogSelectors.selectLearningTokens);

  return (
    <CatalogList
      title={title}
      items={courses}
      emptyMessage="You are not learning anything yet."
    />
  );
};

const PublicCatalogList = ({ title = 'Group Channels' }) => {
  const { coach } = useSelector(coachSelectors.select);
  const tokens = useSelector(coachSelectors.selectPublicTokens);

  return (
    <CatalogList
      title={title}
      items={tokens}
      emptyMessage={`${coach?.displayName || 'This coach'} has no public courses.`}
    />
  );
};

export {
  ProductCatalogList, LearningCatalogList, PublicCatalogList, TemplateCatalogList, NonTemplateCatalogList,
  BaseCatalogList
};
