import React from 'react';
import Grid from '@material-ui/core/Grid';

import './course.scss';

const Course = () => {
  return (
    <Grid
      container
      className="app-content"
    >
      <Grid
        item
        xs={12}
        sm={8}
        className="app-content-main"
      >
        <p>Main</p>
      </Grid>

      <Grid
        item
        xs={12}
        sm={4}
        className="app-content-toc"
      >
        <p>TOC</p>
      </Grid>
    </Grid>
  );
};

export default Course;
