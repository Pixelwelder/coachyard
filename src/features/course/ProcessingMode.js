import { useSelector } from 'react-redux';
import { selectors as selectedCourseSelectors } from './selectedCourseSlice';
import EditItemView from './EditItemView';
import Typography from '@material-ui/core/Typography';
import React from 'react';

/**
 * To a Student, processing mode is monolithic.
 * To a Teacher, it is split into uploading and processing.
 */
const ProcessingMode = ({ status }) => {
  const ownsCourse = useSelector(selectedCourseSelectors.selectOwnsCourse);

  return (
    <div className="item-mode processing-mode">
      {(ownsCourse && status === 'uploading')
        ? (
          <EditItemView requireUpload />
        )
        : (
          <div className="mode-inner">
            <div className="item-info">
              <Typography className="participant-name" variant="h6" component="p">
                Live Session complete!
              </Typography>
              <Typography>Your video is processing and will be available shortly.</Typography>
            </div>
          </div>
        )
      }
    </div>
  );
};

export default ProcessingMode;
