import Typography from '@material-ui/core/Typography';
import React from 'react';

const InitializingMode = () => (
  <div className="item-mode processing-mode">
    <div className="mode-inner">
      <div className="item-info">
        <Typography className="participant-name" variant="h6" component="p">
          Starting Up Live Session
        </Typography>
        <Typography>Be with you in a sec...</Typography>
      </div>
    </div>
  </div>
);

export default InitializingMode;
