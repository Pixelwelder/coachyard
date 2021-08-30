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
import { actions as catalogActions } from '../catalog/catalogSlice';
import ItemTitle from './ItemTitle';
import ReactHtmlParser from 'react-html-parser';
import NoVideoIcon from '@material-ui/icons/NotInterested';
import Attachments from './item/Attachments';
import UploadIcon from '@material-ui/icons/CloudUploadSharp';
import EditIcon from '@material-ui/icons/Edit';
import VideoUploader from './item/VideoUploader';

const ViewingMode = ({ size }) => {
  const { course } = useSelector(selectedCourseSelectors.select);
  const selectedItem = useSelector(selectedCourseSelectors.selectSelectedItem);
  const ownsCourse = useSelector(selectedCourseSelectors.selectOwnsCourse);
  const { isOpen } = useSelector(uiSelectors2.editItem.select);
  const [tab, setTab] = useState(0);
  const dispatch = useDispatch();

  const [isEditing, setIsEditing] = useState(false);
  const onEdit = () => {
    setIsEditing(true);
  };

  const onUploadFile = async (file) => {
    await dispatch(catalogActions.updateItem({
      courseUid: selectedItem.courseUid, itemUid: selectedItem.uid, file
    }))
  };

  return (
    <div className="item-mode viewing-mode">
      {
        isOpen
          ? <EditItemView />
          : (
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
                  {ownsCourse && (
                    <>
                      <Typography className="no-video-message">No video uploaded</Typography>
                      <VideoUploader onSubmit={onUploadFile} />
                    </>
                  )}
                </div>
              )}

              {/*{ownsCourse && (*/}
              {/*  <>*/}
              {/*    <div className="owner-controls">*/}
              {/*      <div className="spacer" />*/}
              {/*      <Button*/}
              {/*        variant="contained"*/}
              {/*        onClick={() => dispatch(uiActions2.editItem.open(selectedItem))}*/}
              {/*      >*/}
              {/*        Edit*/}
              {/*      </Button>*/}
              {/*    </div>*/}
              {/*  </>*/}
              {/*)}*/}
            </>
          )
      }
    </div>
  );
};

export default ViewingMode;
