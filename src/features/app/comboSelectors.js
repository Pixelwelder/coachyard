import { createSelector } from '@reduxjs/toolkit';
import { selectors as selectedCourseSelectors } from '../course/selectedCourseSlice';
import { selectors as catalogSelectors } from '../catalog/catalogSlice';

const selectHasAccessToCurrentCourse = createSelector(
  catalogSelectors.select,
  selectedCourseSelectors.select,
  ({ tokens }, { course }) => {
    return !!course && !!tokens.find(token => token.courseUid === course.uid);
  }
);

export { selectHasAccessToCurrentCourse };
