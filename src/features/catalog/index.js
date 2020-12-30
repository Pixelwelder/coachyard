import React from 'react';
import { TeachingCatalogList, LearningCatalogList } from './CatalogList';
import { Link } from 'react-router-dom';
import makeStyles from '@material-ui/core/styles/makeStyles';

const useStyles = makeStyles({
  container: {
    flex: 1
  }
});

const Catalog = () => {
  const classes = useStyles();

  return (
    <div className={classes.container}>
      <LearningCatalogList />
      <TeachingCatalogList />
    </div>
  );
};

export default Catalog;
