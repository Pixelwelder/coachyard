import { createSelector } from '@reduxjs/toolkit';

export const createTokenSelectors = (rootSelector) => {
  const createTypeFilter = (param, types) => tokens => tokens
    .filter(({ [param]: value }) => types.includes(value));
  const createNegativeTypeFilter = (param, types) => tokens => tokens
    .filter(({ [param]: value }) => !types.includes(value));

  const selectTokens = createSelector(rootSelector, ({ tokensByUid }) => Object.values(tokensByUid));
  const selectPublicTokens = createSelector(selectTokens, createTypeFilter('type', ['public']));
  const selectTemplateTokens = createSelector(selectTokens, createTypeFilter('type', ['template']));
  const selectNonTemplateTokens = createSelector(selectTokens, createNegativeTypeFilter('type', ['template']));
  const selectProductTokens = createSelector(selectTokens, createTypeFilter('type', ['template', 'public']));
  const selectTeachingTokens = createSelector(selectTokens, createTypeFilter('access', ['admin']))
  const selectLearningTokens = createSelector(selectTokens, createTypeFilter('access', ['student']))
  const selectTokensByCourseUid = createSelector(selectTokens, tokens => tokens
    .reduce((accum, token) => ({ ...accum, [token.courseUid]: token }), {}));
  const selectTokensByParentUid = createSelector(selectTokens, tokens => tokens
    .reduce((accum, token) => !!token.parent ? { ...accum, [token.parent]: token } : accum, {}));

  const selectAccessibleTokensByCourseUid = createSelector(
    selectTokensByCourseUid,
    selectTokensByParentUid,
    (tokensByCourseUid, tokensByParentUid) => {
      return { ...tokensByCourseUid, ...tokensByParentUid };
    }
  );
  // const selectTokensForAccess = createSelector(
  //   rootSelector,
  //   selectTokensByParentUid,
  //   ({ tokensByUid }, tokensByParentUid) => ({ ...tokensByParentUid, ...tokensByUid })
  // );

  return {
    selectTokens,
    selectPublicTokens, selectTemplateTokens, selectNonTemplateTokens, selectProductTokens,
    selectTeachingTokens, selectLearningTokens,
    selectTokensByCourseUid, selectTokensByParentUid, selectAccessibleTokensByCourseUid
  };
};
