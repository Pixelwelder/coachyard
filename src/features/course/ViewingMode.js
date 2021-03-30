import { useDispatch, useSelector } from 'react-redux';
import { actions as selectedCourseActions, selectors as selectedCourseSelectors } from './selectedCourseSlice';
import { actions as uiActions2, selectors as uiSelectors2 } from '../ui/uiSlice2';
import EditItemView from './EditItemView';
import Typography from '@material-ui/core/Typography';
import ReactPlayer from 'react-player';
import Button from '@material-ui/core/Button';
import React, { useState } from 'react';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';

const ViewingMode = ({ size }) => {
  const { selectedItem } = useSelector(selectedCourseSelectors.select);
  const ownsCourse = useSelector(selectedCourseSelectors.selectOwnsCourse);
  const { isOpen } = useSelector(uiSelectors2.editItem.select);
  const [tab, setTab] = useState(0);
  const dispatch = useDispatch();

  return (
    <div className="item-mode viewing-mode">
      {
        isOpen
          ? <EditItemView/>
          : (
            <>
              <Typography className="item-title" variant="h6" component="h3">{selectedItem.displayName}</Typography>
              <Tabs
                className="edit-course-tabs"
                onChange={(event, newValue) => setTab(newValue)}
                value={tab}
              >
                <Tab label="Video" />
                <Tab label="Description" />
              </Tabs>
              {tab === 0 && (
                <>
                  {selectedItem?.playbackId && (
                    <div className="player-wrapper">
                      <ReactPlayer
                        width={'100%'}
                        height={'100%'}
                        url={`https://stream.mux.com/${selectedItem.playbackId}.m3u8`}
                        controls={true}
                      />
                    </div>
                  )}
                </>
              )}

              {tab === 1 && (
                <Typography>{selectedItem?.description || ''}</Typography>
              )}

              {ownsCourse && (
                <>
                  <div className="spacer"/>
                  <div className="owner-controls">
                    <Button
                      variant="contained"
                      onClick={() => dispatch(uiActions2.editItem.open())}
                    >
                      Edit
                    </Button>
                  </div>
                </>
              )}
            </>
          )
      }
    </div>
  );
};

export default ViewingMode;
