import React, { useEffect } from 'react';
import Paper from '@material-ui/core/Paper';
import { Redirect, useLocation } from 'react-router-dom';
import queryString from 'query-string';
import { useSelector } from 'react-redux';
import { SizeMe } from 'react-sizeme';
import Typography from '@material-ui/core/Typography';
import { selectors as selectedCourseSelectors } from './selectedCourseSlice';
import ProcessingMode from './ProcessingMode';
import ViewingMode from './ViewingMode';
import LiveMode from './LiveMode';
import InitializingMode from './InitializingMode';
import ScheduledMode from './ScheduledMode';
import NoItem from './NoItem';
import { selectHasAccessToCurrentCourse } from '../app/comboSelectors';
import ReactHtmlParser from 'react-html-parser';

const Locked = ({ item }) => (
  <div className="locked-item">
    <Typography variant="h4">{item.displayName}</Typography>
    <div className="item-description">{ ReactHtmlParser(item?.description || '') }</div>
    <Typography className="purchase-instruction">Purchase this course to unlock this item.</Typography>
  </div>
);

const ItemView = () => {
  const selectedItem = useSelector(selectedCourseSelectors.selectSelectedItem);
  const location = useLocation();
  const query = queryString.parse(location.search);
  const hasAccess = useSelector(selectHasAccessToCurrentCourse);
  const { barebones } = query;

  useEffect(() => {
    // dispatch(uiActions2.editItem.reset());
  }, [selectedItem]);

  return (
    <Paper className="item-view" variant="outlined">
      <SizeMe
        monitorHeight
        monitorPosition
        refreshRate={500}
      >
        {({ size }) => (
          <div className={`item-view-content item-view-content-${selectedItem?.status || ''}`}>
            {
              hasAccess
                ? (
                  <>
                    {!selectedItem && <NoItem />}
                    {selectedItem && (
                    <>
                      {selectedItem.status === 'scheduled' && <ScheduledMode />}
                      {selectedItem.status === 'initializing' && <InitializingMode />}
                      {selectedItem.status === 'live' && (
                      <>
                        {
                            barebones === 'true'
                              ? <Redirect to={`/barebones?id=${selectedItem.uid}`} />
                              : <LiveMode size={size} />
                          }
                      </>
                      )}
                      {(selectedItem.status === 'uploading' || selectedItem.status === 'processing') && (
                      <ProcessingMode status={selectedItem.status} />
                      )}
                      {selectedItem.status === 'viewing' && <ViewingMode size={size} />}
                    </>
                    )}
                  </>
                )
                : (
                  <Locked item={selectedItem} />
                )
            }
          </div>
        )}
      </SizeMe>
    </Paper>
  );
};

export default ItemView;
