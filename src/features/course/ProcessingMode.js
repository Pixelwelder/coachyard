import { useDispatch, useSelector } from 'react-redux';
import Typography from '@material-ui/core/Typography';
import React from 'react';
import Button from '@material-ui/core/Button';
import EditItemView from './EditItemView';
import { selectors as selectedCourseSelectors } from './selectedCourseSlice';
import { actions as uiActions2, selectors as uiSelectors2 } from '../ui/uiSlice2';

/**
 * To a Student, processing mode is monolithic.
 * To a Teacher, it is split into uploading and processing.
 */
const ProcessingMode = ({ status }) => {
  const ownsCourse = useSelector(selectedCourseSelectors.selectOwnsCourse);
  const { isOpen } = useSelector(uiSelectors2.editItem.select);
  const dispatch = useDispatch();

  return (
    <div className="item-mode processing-mode">
      {(ownsCourse && status === 'uploading')
        ? (
          <EditItemView requireUpload />
        )
        : (
          <>
            {isOpen && (
              <EditItemView />
            )}
            {!isOpen && (
              <>
                <div className="mode-inner">
                  <div className="item-info">
                    <Typography className="participant-name" variant="h6" component="p">
                      Video Processing
                    </Typography>
                    <Typography>Our server elves are processing this video. It will be available shortly.</Typography>
                  </div>
                </div>
                {/*{ownsCourse && (*/}
                {/*  <>*/}
                {/*    <div className="owner-controls">*/}
                {/*      <div className="spacer" />*/}
                {/*      <Button*/}
                {/*        variant="contained"*/}
                {/*        onClick={() => dispatch(uiActions2.editItem.open())}*/}
                {/*      >*/}
                {/*        Edit*/}
                {/*      </Button>*/}
                {/*    </div>*/}
                {/*  </>*/}
                {/*)}*/}
              </>
            )}
          </>
        )}
    </div>
  );
};

export default ProcessingMode;
