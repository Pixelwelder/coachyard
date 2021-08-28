import React, { useEffect, useState } from 'react';
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
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Attachments from './item/Attachments';
import ItemDescription from './item/ItemDescription';
import Button from '@material-ui/core/Button';
import { actions as uiActions2 } from '../ui/uiSlice2';

const Locked = ({ item }) => (
  <div className="locked-item">
    <Typography variant="h4">{item.displayName}</Typography>
    <div className="item-description">{ ReactHtmlParser(item?.description || '') }</div>
    <Typography className="purchase-instruction">Purchase this course to unlock this item.</Typography>
  </div>
);

const ItemView = () => {
  const selectedItem = useSelector(selectedCourseSelectors.selectSelectedItem);
  const ownsCourse = useSelector(selectedCourseSelectors.selectOwnsCourse);
  const location = useLocation();
  const query = queryString.parse(location.search);
  const hasAccess = useSelector(selectHasAccessToCurrentCourse);
  const { barebones } = query;
  const [tab, setTab] = useState(0);

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
          <>
            <div className="item-view-header">
              <Typography className="item-view-title" variant="h6">{selectedItem?.displayName || ''}</Typography>
              <Tabs
                className="edit-course-tabs"
                onChange={(event, newValue) => setTab(newValue)}
                value={tab}
              >
                <Tab label="Video" />
                <Tab label="Description" />
                <Tab label="Attachments" />
              </Tabs>
            </div>

            <div className={`item-view-content item-view-content-${selectedItem?.status || ''}`}>
              {tab === 0 && (
                <>
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
                </>
              )}

              {tab === 1 && (
                <ItemDescription selectedItem={selectedItem} ownsItem={ownsCourse} />
              )}

              {tab === 2 && (
                <Attachments />
              )}

            </div>
          </>
        )}
      </SizeMe>
    </Paper>
  );
};

export default ItemView;
