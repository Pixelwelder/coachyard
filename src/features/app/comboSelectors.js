import { createSelector } from '@reduxjs/toolkit';
import { selectors as selectedCourseSelectors } from '../course/selectedCourseSlice';
import { selectors as catalogSelectors } from '../catalog/catalogSlice';

const selectHasAccessToCurrentCourse = createSelector(
  catalogSelectors.selectTokens,
  selectedCourseSelectors.select,
  (tokens, { course }) => !!course && !!tokens.find((token) => token.courseUid === course.uid),
);

export { selectHasAccessToCurrentCourse };
