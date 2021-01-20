import { useDispatch, useSelector } from 'react-redux';
import { selectors as selectedCourseSelectors } from './selectedCourseSlice';
import { actions as uiActions2, selectors as uiSelectors2 } from '../ui/uiSlice2';
import { EditView } from './EditView';
import Typography from '@material-ui/core/Typography';
import ReactPlayer from 'react-player';
import Button from '@material-ui/core/Button';
import React from 'react';

export const ViewingMode = ({ size }) => {
  const { selectedItem } = useSelector(selectedCourseSelectors.select);
  const { isOpen } = useSelector(uiSelectors2.editItem.select);
  const dispatch = useDispatch();

  return (
    <div className="item-mode viewing-mode">
      {
        isOpen
          ? <EditView/>
          : (
            <>
              <Typography className="item-title" variant="h6" component="h3">{selectedItem.displayName}</Typography>
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
          )
      }
    </div>
  );
}
