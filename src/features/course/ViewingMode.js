import { useDispatch, useSelector } from 'react-redux';
import Typography from '@material-ui/core/Typography';
import ReactPlayer from 'react-player';
import Button from '@material-ui/core/Button';
import React, { useState } from 'react';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import EditItemView from './EditItemView';
import { actions as uiActions2, selectors as uiSelectors2 } from '../ui/uiSlice2';
import { selectors as selectedCourseSelectors } from './selectedCourseSlice';
import ItemTitle from './ItemTitle';
import ReactHtmlParser from 'react-html-parser';
import NoVideoIcon from '@material-ui/icons/NotInterested';

const ViewingMode = ({ size }) => {
  const { course } = useSelector(selectedCourseSelectors.select);
  const selectedItem = useSelector(selectedCourseSelectors.selectSelectedItem);
  const ownsCourse = useSelector(selectedCourseSelectors.selectOwnsCourse);
  const { isOpen } = useSelector(uiSelectors2.editItem.select);
  const [tab, setTab] = useState(0);
  const dispatch = useDispatch();

  return (
    <div className="item-mode viewing-mode">
      {
        isOpen
          ? <EditItemView />
          : (
            <>
              <ItemTitle item={selectedItem} />
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
                    <>
                      <div className="player-wrapper">
                        <ReactPlayer
                          width="100%"
                          height="100%"
                          url={`https://stream.mux.com/${selectedItem.playbackId}.m3u8`}
                          controls
                        />
                      </div>
                      <div className="spacer" />
                    </>
                  )}
                  {!selectedItem.streamingId && (
                    <div className="no-video">
                      <NoVideoIcon />
                      <Typography>No video uploaded</Typography>
                    </div>
                  )}
                </>
              )}

              {tab === 1 && (
                <>
                  <Typography variant="h4">{selectedItem?.displayName || 'No Item Selected'}</Typography>
                  <div className="item-description">{ ReactHtmlParser(selectedItem?.description || '') }</div>
                </>
              )}

              {ownsCourse && (
                <>
                  <div className="owner-controls">
                    <div className="spacer" />
                    <Button
                      variant="contained"
                      onClick={() => dispatch(uiActions2.editItem.open(selectedItem))}
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
